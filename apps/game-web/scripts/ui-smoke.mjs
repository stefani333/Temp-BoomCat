/**
 * 本地 UI 冒烟脚本：用系统 Chrome 的 CDP 接口驱动真实页面。
 * 覆盖：创建房间、加入模拟玩家、准备、指定起始玩家、开始游戏、出牌或抽牌、模拟玩家连续行动。
 * 用法：先启动 `pnpm dev`，再执行 `pnpm --filter @bombcat/game-web ui:smoke`。
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = process.env.APP_URL || 'http://localhost:5200/';
const PORT = Number(process.env.CDP_PORT || 9333);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(...args) {
  console.log(`[ui-smoke]`, ...args);
}

async function waitFor(check, timeoutMs, intervalMs = 300) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value) return value;
    await sleep(intervalMs);
  }
  return null;
}

const profileDir = await mkdtemp(path.join(tmpdir(), 'boomcat-ui-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,1000',
    ...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let bombConfirmChecked = false;

let socket;
let nextId = 1;
const pendingCalls = new Map();
const pageErrors = [];
let finished = false;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pendingCalls.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pendingCalls.has(id)) {
        pendingCalls.delete(id);
        reject(new Error(`CDP 超时：${method}`));
      }
    }, 20000);
  });
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  }
  return response.result?.value;
}

async function clickText(text) {
  return evaluate(
    `(() => {
      const norm = (t) => (t || '').replace(/\\s+/g, '');
      const target = norm(${JSON.stringify(text)});
      const button = [...document.querySelectorAll('button')]
        .find((el) => !el.disabled && norm(el.textContent).includes(target));
      if (!button) return false;
      button.click();
      return true;
    })()`,
  );
}

async function clickSelector(selector) {
  return evaluate(
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el || el.disabled) return false;
      el.click();
      return true;
    })()`,
  );
}

async function snapshot() {
  return evaluate(
    `(() => {
      const text = (selector) => document.querySelector(selector)?.innerText?.trim() || '';
      const drawButton = [...document.querySelectorAll('button')]
        .find((el) => el.textContent.includes('抽牌并结束回合'));
      const modal = document.querySelector('.modal');
      return {
        result: text('.result-hero h1'),
        table: Boolean(document.querySelector('.hand-zone')),
        room: Boolean(document.querySelector('.seat-list')) && !modal,
        current: text('.game__turn'),
        drawPile: text('.pile__value'),
        logCount: document.querySelectorAll('.event-log .event').length,
        logTail: [...document.querySelectorAll('.event-log .event')].slice(-4).map((el) => el.innerText),
        handCount: document.querySelectorAll('.hand .card').length,
        myTurn: Boolean(drawButton && !drawButton.disabled),
        modalTitle: modal ? text('.modal h3') : '',
        modalButtons: modal
          ? [...modal.querySelectorAll('button')].filter((b) => !b.disabled).map((b) => b.innerText.trim())
          : [],
        errors: window.__uiErrors || [],
      };
    })()`,
  );
}

async function handleModal() {
  const snap = await snapshot();
  if (!snap.modalTitle) return 'none';
  const title = snap.modalTitle;
  log('处理浮层：', title, snap.modalButtons.join(' / '));
  if (title.includes('是否使用休想')) {
    await clickText('放弃');
  } else if (title.includes('选择交给')) {
    await clickSelector('.favor-picker .card');
  } else if (title.includes('你抽到了炸弹猫')) {
    const hasConfirm = snap.modalButtons.includes('确认淘汰');
    if (hasConfirm) {
      log('检测到二次确认浮层，选择取消');
      await clickText('取消');
    } else if (snap.modalButtons.includes('使用拆除') && !bombConfirmChecked) {
      bombConfirmChecked = true;
      log('验证炸弹放弃二次确认：先点击放弃并淘汰');
      await clickText('放弃并淘汰');
      await sleep(400);
      const cancelled = await clickText('取消');
      log(cancelled ? '二次确认取消成功' : '未找到取消按钮');
      await sleep(300);
      if (await clickText('使用拆除')) {
        log('取消确认后继续使用拆除');
      } else {
        await clickText('放弃并淘汰');
      }
    } else {
      const used = await clickText('使用拆除');
      if (!used) await clickText('放弃并淘汰');
    }
  } else if (title.includes('放回炸弹猫')) {
    await clickText('牌堆顶部');
  } else if (title.includes('预见未来')) {
    await clickText('知道了');
  } else if (title.includes('选择目标')) {
    await clickSelector('.target-list .target');
  } else if (title.includes('指定卡牌名称')) {
    await clickSelector('.name-grid button');
  } else if (title.includes('弃牌堆选择')) {
    await clickSelector('.discard-picker button');
  } else {
    log('未知浮层，尝试取消');
    await clickText('取消');
  }
  await sleep(1200);
  return title;
}

let exitCode = 1;
try {
  const target = await waitFor(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await response.json();
      return list.find((item) => item.type === 'page') ?? null;
    } catch {
      return null;
    }
  }, 20000);
  if (!target) throw new Error('无法连接 Chrome 调试端口');

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pendingCalls.has(message.id)) {
      const { resolve, reject } = pendingCalls.get(message.id);
      pendingCalls.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      pageErrors.push(message.params.exceptionDetails?.exception?.description || '脚本异常');
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__uiErrors = [];
      window.addEventListener('error', (event) => window.__uiErrors.push(String(event.message)));
      window.addEventListener('unhandledrejection', (event) => window.__uiErrors.push(String(event.reason)));`,
  });
  await send('Page.navigate', { url: APP_URL });
  await sleep(1600);

  log('选择 3 人局');
  if (!(await clickText('3 人'))) throw new Error('未找到 3 人按钮');
  await sleep(300);
  log('验证首页规则入口');
  if (!(await clickText('查看规则'))) throw new Error('未找到查看规则按钮');
  await sleep(400);
  const rulesTitle = await evaluate(`document.querySelector('.modal h3')?.innerText || ''`);
  if (!rulesTitle.includes('规则摘要')) throw new Error('规则摘要浮层未打开');
  if (!(await clickText('知道了'))) throw new Error('规则摘要浮层缺少关闭按钮');
  await sleep(300);
  log('创建房间');
  if (!(await clickText('创建并进入房间'))) throw new Error('未找到创建房间按钮');
  await sleep(900);

  log('加入 2 个模拟玩家');
  if (!(await clickText('加入模拟玩家'))) throw new Error('未找到加入模拟玩家按钮');
  await sleep(500);
  if (!(await clickText('加入模拟玩家'))) throw new Error('未找到加入模拟玩家按钮');
  await sleep(500);

  log('准备并指定起始玩家');
  if (!(await clickText('我准备'))) throw new Error('未找到准备按钮');
  await sleep(400);
  const selected = await evaluate(
    `(() => {
      const select = document.querySelector('select');
      if (!select) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, 'p1');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
  );
  if (!selected) throw new Error('未找到起始玩家选择框');
  await sleep(500);
  const startEnabled = await evaluate(
    `(() => [...document.querySelectorAll('button')]
      .some((el) => el.textContent.includes('开始游戏') && !el.disabled))()`,
  );
  if (!startEnabled) throw new Error('开始游戏按钮仍不可用');
  log('开始游戏');
  await clickText('开始游戏');
  await sleep(2200);

  let snap = await snapshot();
  log('牌桌初始状态：', JSON.stringify({ hand: snap.handCount, current: snap.current, draw: snap.drawPile }));
  if (!snap.table || snap.handCount !== 5) throw new Error('牌桌未正确显示 5 张初始手牌');
  if (!snap.myTurn) throw new Error('起始玩家不是本人');

  log('验证本地恢复：刷新页面');
  await send('Page.reload');
  await sleep(1800);
  const resumeVisible = await evaluate(`document.body.innerText.includes('继续上局')`);
  if (!resumeVisible) throw new Error('刷新后首页未显示继续上局入口');
  if (!(await clickText('继续上局'))) throw new Error('未找到继续上局按钮');
  await sleep(1200);
  snap = await snapshot();
  if (!snap.table || snap.handCount !== 5) throw new Error('刷新后未能恢复到牌桌');
  if (snap.logCount === 0) throw new Error('恢复后的对局日志为空');
  log('刷新后恢复成功，日志条数', snap.logCount);

  log('抽牌结束第一回合');
  await clickText('抽牌并结束回合');
  await sleep(2000);

  let playedCard = false;
  let sawBotAction = false;
  let lastLogCount = snap.logCount;
  let result = '';

  for (let step = 1; step <= 80; step += 1) {
    snap = await snapshot();
    if (snap.logCount > lastLogCount) lastLogCount = snap.logCount;
    if (snap.result) {
      result = snap.result;
      log(`第 ${step} 轮：对局结束，获胜者 ${result}`);
      break;
    }
    if (snap.modalTitle) {
      await handleModal();
      sawBotAction = true;
      continue;
    }
    if (snap.myTurn) {
      if (!playedCard) {
        const played = await evaluate(
          `(() => {
            const card = [...document.querySelectorAll('.hand .card')].find((el) =>
              /跳过|预见未来|洗混|攻击/.test(el.innerText) && !el.disabled);
            if (!card) return false;
            card.click();
            return true;
          })()`,
        );
        if (played) {
          await sleep(250);
          if (await clickText('出牌')) {
            playedCard = true;
            log(`第 ${step} 轮：真人在 UI 中打出卡牌`);
            await sleep(1800);
            continue;
          }
        }
      }
      log(`第 ${step} 轮：真人抽牌`);
      await clickText('抽牌并结束回合');
      await sleep(1800);
      continue;
    }
    sawBotAction = true;
    await sleep(1400);
  }

  snap = await snapshot();
  let returnedRoom = false;
  if (result) {
    log('验证结算页返回房间');
    if (!(await clickText('返回房间'))) throw new Error('未找到返回房间按钮');
    await sleep(1000);
    returnedRoom = await evaluate(
      `(() => document.body.innerText.includes('等待开局')
        && document.querySelectorAll('.seat-list .seat').length === 3)()`,
    );
    if (!returnedRoom) throw new Error('返回房间后未恢复到等待开局页面');
    log('返回房间成功，座位数 3');
  }

  const summary = {
    reachedTable: snap.table,
    handCountAtStart: 5,
    sawBotAction,
    playedCardInUi: playedCard,
    returnedRoom,
    result,
    current: snap.current,
    logTail: snap.logTail,
    pageErrors: [...pageErrors, ...(snap.errors || [])],
  };
  log('结果：', JSON.stringify(summary, null, 2));

  if (!sawBotAction) throw new Error('模拟玩家没有任何行动');
  if (summary.pageErrors.length > 0) throw new Error(`页面出现异常：${summary.pageErrors.join(' | ')}`);
  exitCode = 0;
} catch (error) {
  log('失败：', error instanceof Error ? error.message : String(error));
} finally {
  try {
    socket?.close();
  } catch {
    // 忽略关闭异常
  }
  chrome.kill('SIGTERM');
  await sleep(500);
  await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  finished = true;
  process.exit(exitCode);
}

if (finished) {
  log('完成');
}
