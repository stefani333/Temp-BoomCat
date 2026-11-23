import { useState } from 'react';
import { displayName } from '../game';
import type { CardKind, HandCard, OverlayKind, TableState } from '../types';
import { Modal } from '../ui';

type Classification =
  | { kind: 'single'; card: HandCard }
  | { kind: 'comboTwo' | 'comboThree' | 'comboFive' }
  | { kind: 'error'; message: string };

const KIND_LABEL: Record<CardKind, string> = {
  action: '行动',
  cat: '猫咪',
  defuse: '拆除',
  bomb: '炸弹',
  nope: '反制',
};

const GUESS_NAMES = [
  '炸弹猫',
  '拆除',
  '休想',
  '恩惠',
  '攻击',
  '跳过',
  '洗混',
  '预见未来',
  '冰淇淋猫咪',
  '薯条猫咪',
  '汉堡猫咪',
  '卷饼猫咪',
  '炸鸡猫咪',
];

const DISCARD_CARDS = ['跳过', '恩惠', '洗混'];

function classify(cards: HandCard[]): Classification {
  if (cards.length === 0) return { kind: 'error', message: '请先选择要打出的卡牌' };
  if (cards.length === 1) {
    const card = cards[0]!;
    if (card.kind === 'cat') {
      return { kind: 'error', message: '特殊猫咪不能单独打出，请组合使用。' };
    }
    if (card.kind === 'bomb' || card.kind === 'defuse' || card.kind === 'nope') {
      return { kind: 'error', message: '该卡牌不能主动打出。' };
    }
    return { kind: 'single', card };
  }
  if (cards.some((card) => card.kind !== 'cat')) {
    return { kind: 'error', message: '组合只能由特殊猫咪组成。' };
  }
  if (cards.length === 2 || cards.length === 3) {
    const firstName = cards[0]!.name;
    if (cards.some((card) => card.name !== firstName)) {
      return { kind: 'error', message: '所选卡牌不构成有效组合，需要相同名称的特殊猫咪。' };
    }
    return { kind: cards.length === 2 ? 'comboTwo' : 'comboThree' };
  }
  if (cards.length === 5) {
    if (new Set(cards.map((card) => card.name)).size !== 5) {
      return { kind: 'error', message: '五张组合需要名称各不相同的特殊猫咪。' };
    }
    return { kind: 'comboFive' };
  }
  return { kind: 'error', message: '无效的组合数量。' };
}

interface TableSceneProps {
  table: TableState;
  initialOverlay?: OverlayKind;
  initialSelection?: string[];
  onUpdate: (patch: Partial<TableState>) => void;
}

export function TableScene({ table, initialOverlay, initialSelection, onUpdate }: TableSceneProps) {
  const [selected, setSelected] = useState<string[]>(
    (initialSelection ?? []).filter((id) => table.hand.some((card) => card.id === id)),
  );
  const [dialog, setDialog] = useState<OverlayKind>(initialOverlay ?? null);
  const [note, setNote] = useState('');
  const [errorText, setErrorText] = useState(
    '所选卡牌不构成有效组合，请选择两张相同、三张相同或五张不同的特殊猫咪。',
  );
  const [targetId, setTargetId] = useState(
    () => table.seats.find((seat) => seat.alive && seat.id !== 'p1')?.id ?? '',
  );
  const [named, setNamed] = useState('');
  const [discardPick, setDiscardPick] = useState('');
  const [placeMode, setPlaceMode] = useState<'' | 'top' | 'bottom' | 'index'>('');
  const [placeIndex, setPlaceIndex] = useState('1');
  const [giveUpConfirm, setGiveUpConfirm] = useState(false);

  const current = table.seats.find((seat) => seat.id === table.currentId);
  const isMyTurn = table.currentId === 'p1';
  const selectedCards = table.hand.filter((card) => selected.includes(card.id));
  const classification = classify(selectedCards);
  const hasDefuse = table.hand.some((card) => card.kind === 'defuse');
  const aliveOpponents = table.seats.filter((seat) => seat.alive && seat.id !== 'p1');
  const targetName =
    table.seats.find((seat) => seat.id === targetId)?.name ?? aliveOpponents[0]?.name ?? '模拟玩家 A';
  const selectedLabel =
    selectedCards.length === 0
      ? '未选择'
      : selectedCards.every((card) => card.name === selectedCards[0]!.name)
        ? `${selectedCards[0]!.name} ×${selectedCards.length}`
        : selectedCards.map((card) => card.name).join('、');

  const indexValue = Number(placeIndex);
  const indexValid = Number.isInteger(indexValue) && indexValue >= 1 && indexValue <= table.drawPile + 1;
  const placeReady =
    placeMode === 'top' || placeMode === 'bottom' || (placeMode === 'index' && indexValid);

  const toggleCard = (cardId: string) => {
    if (!isMyTurn) {
      setNote('等待当前玩家行动，出牌与抽牌按钮已禁用。');
      return;
    }
    setSelected((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 5) return prev;
      return [...prev, cardId];
    });
    setNote('');
  };

  const commitSelected = (message: string) => {
    const ids = selected.filter((id) => table.hand.some((card) => card.id === id));
    onUpdate({
      hand: table.hand.filter((card) => !ids.includes(card.id)),
      log: [...table.log, message],
    });
    setSelected([]);
    setDialog(null);
    setNote('');
  };

  const handlePlay = () => {
    if (!isMyTurn) return;
    if (selected.length === 0) {
      setNote('请先选择要打出的卡牌。');
      return;
    }
    const result = classify(selectedCards);
    if (result.kind === 'error') {
      setErrorText(result.message);
      setDialog('comboError');
      return;
    }
    if (result.kind === 'single') {
      setDialog('play');
      return;
    }
    setDialog('combo');
  };

  const handleSingleConfirm = () => {
    const card = selectedCards[0];
    if (!card) {
      setDialog(null);
      return;
    }
    if (card.name === '恩惠') {
      setDialog('target');
      return;
    }
    if (card.name === '预见未来') {
      setDialog('foresee');
      return;
    }
    if (card.name === '攻击') {
      setDialog('counter');
      return;
    }
    commitSelected(`我打出 ${displayName(card)}。`);
  };

  const handleComboConfirm = () => {
    if (classification.kind === 'comboTwo') {
      setDialog('target');
      return;
    }
    if (classification.kind === 'comboThree') {
      setDialog('guess');
      return;
    }
    if (classification.kind === 'comboFive') {
      setDialog('discard');
    }
  };

  const handleTargetConfirm = () => {
    const target = table.seats.find((seat) => seat.id === targetId && seat.alive);
    if (!target) return;
    const played =
      selectedCards.length > 1
        ? `${selectedCards[0]!.name} ×${selectedCards.length}`
        : selectedCards[0]
          ? displayName(selectedCards[0])
          : '组合';
    commitSelected(`我打出 ${played}，目标：${target.name}。`);
  };

  const handleGuessConfirm = () => {
    if (!named) return;
    commitSelected(`我打出三张相同猫咪，目标：${targetName}，指定卡牌：${named}。`);
  };

  const handleDiscardConfirm = () => {
    if (table.discardCount <= 0 || !discardPick) return;
    commitSelected(`我打出五张不同猫咪，从弃牌堆选择：${discardPick}。`);
  };

  const handleForeseeConfirm = () => {
    commitSelected(
      selectedCards.length > 0
        ? '我使用预见未来，查看抽牌堆顶部三张，并按原顺序放回。'
        : '演示：查看抽牌堆顶部三张，并按原顺序放回。',
    );
  };

  const handleCounter = (useNope: boolean) => {
    const attack = selectedCards.find((card) => card.name === '攻击');
    onUpdate({
      hand: attack ? table.hand.filter((card) => card.id !== attack.id) : table.hand,
      log: [
        ...table.log,
        attack ? '我打出攻击（高潮）。' : '演示：等待其他玩家响应休想。',
        useNope ? '其他玩家使用休想反制。' : '其他玩家放弃响应。',
      ],
    });
    setSelected([]);
    setDialog(null);
    setNote(useNope ? '休想已生效，攻击被取消。' : '无人使用休想，攻击生效。');
  };

  const handleUseDefuse = () => {
    const defuse = table.hand.find((card) => card.kind === 'defuse');
    if (!defuse) return;
    onUpdate({
      hand: table.hand.filter((card) => card.id !== defuse.id),
      log: [...table.log, '我使用拆除（消火），避免淘汰。'],
    });
    setGiveUpConfirm(false);
    setDialog('bombPlace');
  };

  const handleGiveUp = () => {
    const next = table.seats.find((seat) => seat.alive && seat.id !== 'p1');
    onUpdate({
      seats: table.seats.map((seat) => (seat.id === 'p1' ? { ...seat, alive: false } : seat)),
      currentId: next?.id ?? table.currentId,
      log: [...table.log, '我放弃使用拆除，被淘汰（演示）。'],
    });
    setGiveUpConfirm(false);
    setDialog(null);
    setNote('已放弃拆除，演示中我已被淘汰。');
  };

  const handlePlaceConfirm = () => {
    if (!placeReady) return;
    const position =
      placeMode === 'top' ? '牌堆顶部' : placeMode === 'bottom' ? '牌堆底部' : `第 ${placeIndex} 张`;
    onUpdate({ log: [...table.log, `炸弹猫已放回：${position}（对其他玩家保密）。`] });
    setDialog(null);
    setNote(`炸弹猫已放回：${position}。`);
  };

  const handleDraw = () => {
    if (!isMyTurn) return;
    if (table.drawPile <= 0) {
      setNote('牌堆异常，禁止抽牌并记录问题。');
      onUpdate({ log: [...table.log, '抽牌失败：抽牌堆为空，已记录问题。'] });
      return;
    }
    const alive = table.seats.filter((seat) => seat.alive);
    const index = alive.findIndex((seat) => seat.id === table.currentId);
    const next = alive[(index + 1) % alive.length];
    onUpdate({
      drawPile: table.drawPile - 1,
      discardCount: table.discardCount + 1,
      currentId: next?.id ?? table.currentId,
      log: [
        ...table.log,
        '我抽了一张牌，回合结束。',
        next ? `当前玩家：${next.name}` : '当前玩家：我',
      ],
    });
    setNote(next ? `已抽牌，等待 ${next.name} 行动。` : '已抽牌，回合结束。');
  };

  const hints: string[] = [];
  if (!isMyTurn) hints.push('等待当前玩家行动，出牌与抽牌按钮已禁用。');
  if (table.drawPile <= 0) hints.push('牌堆异常：抽牌堆为空，已禁止抽牌并记录问题。');
  if (note) hints.push(note);

  return (
    <div className="wf-screen table-screen">
      <header className="tbl-head">
        <span className="tbl-round">第 {table.round} 轮</span>
        <span className="tbl-current">当前：{current?.name ?? '—'}</span>
        <span className="wf-muted">抽牌堆 {table.drawPile}</span>
        <span className="wf-muted">弃牌堆 {table.discardCount}</span>
        <button type="button" className="wf-btn small" onClick={() => setDialog('log')}>
          日志
        </button>
      </header>

      <div className="tbl-body">
        <section className="tbl-opponents">
          {table.seats
            .filter((seat) => seat.id !== 'p1')
            .map((seat) => (
              <div
                key={seat.id}
                className={`opp${seat.alive ? '' : ' opp--out'}${
                  seat.id === table.currentId ? ' opp--current' : ''
                }`}
              >
                <div className="opp-name">{seat.name}</div>
                <div>手牌 {seat.alive ? seat.handCount : '—'}</div>
                <div>{seat.alive ? '存活' : '已淘汰'}</div>
                {seat.id === table.currentId ? <div className="opp-tag">当前回合</div> : null}
              </div>
            ))}
        </section>

        <div className="tbl-main">
          <section className="tbl-center">
            <button type="button" className="pile pile--button" onClick={() => setDialog('discardPile')}>
              <span className="wf-label">弃牌堆顶</span>
              <strong>{table.discardCount > 0 ? table.discardTop : '（空）'}</strong>
              <span className="wf-muted">共 {table.discardCount} 张</span>
            </button>
            <div className="pile">
              <span className="wf-label">抽牌堆</span>
              <strong>{table.drawPile} 张</strong>
              <span className="wf-muted">仅显示剩余张数</span>
            </div>
            {table.remainingTurns > 1 ? (
              <div className="wf-hint">剩余回合数：{table.remainingTurns}</div>
            ) : null}
          </section>

          <aside className="tbl-log-side">
            <div className="wf-panel-title">对局日志</div>
            <ul className="log-list">
              {table.log.slice(-6).map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          </aside>
        </div>

        <section className="tbl-hand">
          <div className="tbl-hand-head">
            <span>我的手牌（{table.hand.length}）</span>
            <span className="wf-muted">已选：{selectedLabel}</span>
          </div>
          <div className="hand">
            {table.hand.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`hand-card${selected.includes(card.id) ? ' hand-card--selected' : ''}`}
                onClick={() => toggleCard(card.id)}
                disabled={!isMyTurn}
              >
                <span className="hand-card-kind">{KIND_LABEL[card.kind]}</span>
                <span className="hand-card-name">{card.name}</span>
                <span className="hand-card-effect">{card.effect}</span>
              </button>
            ))}
            {table.hand.length === 0 ? <div className="wf-empty">手牌已空</div> : null}
          </div>
        </section>
      </div>

      {hints.length > 0 ? (
        <div className="tbl-hints">
          {hints.map((text) => (
            <div className="wf-hint" key={text}>
              {text}
            </div>
          ))}
        </div>
      ) : null}

      <footer className="tbl-actions">
        <button type="button" className="wf-btn primary" onClick={handlePlay} disabled={!isMyTurn}>
          出牌
        </button>
        <button type="button" className="wf-btn" onClick={handleDraw} disabled={!isMyTurn}>
          抽牌并结束回合
        </button>
      </footer>

      {dialog === 'play' && selectedCards[0] ? (
        <Modal
          title="出牌"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="wf-btn primary" onClick={handleSingleConfirm}>
                {selectedCards[0].name === '恩惠'
                  ? '选择目标'
                  : selectedCards[0].name === '预见未来'
                    ? '查看牌堆顶'
                    : selectedCards[0].name === '攻击'
                      ? '打出并等待响应'
                      : '确定打出'}
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">已选：{displayName(selectedCards[0])}</p>
          <div className="wf-dialog-block">
            <span className="wf-label">效果</span>
            <p>{selectedCards[0].effect}</p>
          </div>
        </Modal>
      ) : null}

      {dialog === 'combo' ? (
        <Modal
          title="组合出牌"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                重新选择
              </button>
              <button type="button" className="wf-btn primary" onClick={handleComboConfirm}>
                作为组合打出
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">
            已选 {selectedCards.length} 张：{selectedLabel}
          </p>
          <p className="wf-dialog-desc">
            可识别组合：
            {classification.kind === 'comboTwo'
              ? '两张相同猫咪'
              : classification.kind === 'comboThree'
                ? '三张相同猫咪'
                : classification.kind === 'comboFive'
                  ? '五张不同猫咪'
                  : '未识别'}
          </p>
        </Modal>
      ) : null}

      {dialog === 'comboError' ? (
        <Modal
          title="组合校验失败"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
              知道了
            </button>
          }
        >
          <p className="wf-dialog-desc">{errorText}</p>
          <p className="wf-help">有效组合：两张相同、三张相同或五张不同的特殊猫咪。</p>
        </Modal>
      ) : null}

      {dialog === 'counter' ? (
        <Modal
          title="等待其他玩家响应休想"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => handleCounter(true)}>
                使用休想
              </button>
              <button type="button" className="wf-btn primary" onClick={() => handleCounter(false)}>
                放弃
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">打出的卡牌：攻击（高潮）</p>
          <p className="wf-dialog-desc">反制层数：1</p>
          <p className="wf-help">等待其他玩家决定是否使用休想。</p>
        </Modal>
      ) : null}

      {dialog === 'target' ? (
        <Modal
          title="选择目标"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                type="button"
                className="wf-btn primary"
                onClick={handleTargetConfirm}
                disabled={!table.seats.some((seat) => seat.id === targetId && seat.alive)}
              >
                确认
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">恩惠：目标玩家需交出一张手牌</p>
          <div className="target-list">
            {table.seats
              .filter((seat) => seat.id !== 'p1')
              .map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  className={`target-row${targetId === seat.id ? ' active' : ''}`}
                  disabled={!seat.alive}
                  onClick={() => setTargetId(seat.id)}
                >
                  <span>{seat.name}</span>
                  <span>{seat.alive ? `手牌 ${seat.handCount}` : '已淘汰'}</span>
                </button>
              ))}
          </div>
        </Modal>
      ) : null}

      {dialog === 'guess' ? (
        <Modal
          title="指定卡牌名称"
          onClose={() => setDialog(null)}
          width={420}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                type="button"
                className="wf-btn primary"
                onClick={handleGuessConfirm}
                disabled={!named}
              >
                确认
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">目标：{targetName}</p>
          <div className="guess-grid">
            {GUESS_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={`wf-chip${named === name ? ' active' : ''}`}
                onClick={() => setNamed(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {dialog === 'discard' ? (
        <Modal
          title="从弃牌堆选择一张加入手牌"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                取消
              </button>
              <button
                type="button"
                className="wf-btn primary"
                onClick={handleDiscardConfirm}
                disabled={table.discardCount <= 0 || !discardPick}
              >
                确认
              </button>
            </>
          }
        >
          {table.discardCount <= 0 ? (
            <div className="wf-empty">弃牌堆为空，无法选择弃牌。</div>
          ) : (
            <div className="discard-grid">
              {DISCARD_CARDS.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`hand-card${discardPick === name ? ' hand-card--selected' : ''}`}
                  onClick={() => setDiscardPick(name)}
                >
                  <span className="hand-card-kind">弃牌</span>
                  <span className="hand-card-name">{name}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      ) : null}

      {dialog === 'foresee' ? (
        <Modal
          title="预见未来"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={handleForeseeConfirm}>
              知道了
            </button>
          }
        >
          <p className="wf-dialog-desc">抽牌堆顶部三张（仅你可见）：</p>
          <ol className="foresee-list">
            <li>炸弹猫</li>
            <li>跳过（逃脱）</li>
            <li>薯条猫咪</li>
          </ol>
          <p className="wf-help">按原顺序放回牌堆顶部。</p>
        </Modal>
      ) : null}

      {dialog === 'bomb' ? (
        <Modal
          title="你抽到了炸弹猫"
          onClose={() => setDialog(null)}
          footer={
            giveUpConfirm ? (
              <>
                <button
                  type="button"
                  className="wf-btn"
                  onClick={() => setGiveUpConfirm(false)}
                >
                  返回
                </button>
                <button type="button" className="wf-btn primary" onClick={handleGiveUp}>
                  确认淘汰
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="wf-btn"
                  onClick={() => setGiveUpConfirm(true)}
                >
                  放弃并淘汰
                </button>
                <button
                  type="button"
                  className="wf-btn primary"
                  onClick={handleUseDefuse}
                  disabled={!hasDefuse}
                >
                  使用拆除
                </button>
              </>
            )
          }
        >
          <p className="wf-dialog-desc">使用一张拆除（消火）可避免淘汰。</p>
          <p className="wf-help">拆除处理不可被休想取消。</p>
          {giveUpConfirm ? (
            <div className="wf-hint">确认放弃并淘汰？淘汰后将移出本局。</div>
          ) : null}
          {!hasDefuse ? (
            <div className="wf-hint">当前手牌中没有拆除卡，只能确认淘汰，并展示即将移出本局的提示。</div>
          ) : null}
        </Modal>
      ) : null}

      {dialog === 'bombPlace' ? (
        <Modal
          title="炸弹猫放回位置"
          onClose={() => setDialog(null)}
          footer={
            <button
              type="button"
              className="wf-btn primary"
              onClick={handlePlaceConfirm}
              disabled={!placeReady}
            >
              确认放回
            </button>
          }
        >
          <p className="wf-dialog-desc">炸弹猫放回位置（对其他玩家保密）</p>
          <p className="wf-dialog-desc">抽牌堆当前 {table.drawPile} 张</p>
          <div className="place-options">
            <button
              type="button"
              className={`wf-chip${placeMode === 'top' ? ' active' : ''}`}
              onClick={() => setPlaceMode('top')}
            >
              牌堆顶部
            </button>
            <button
              type="button"
              className={`wf-chip${placeMode === 'bottom' ? ' active' : ''}`}
              onClick={() => setPlaceMode('bottom')}
            >
              牌堆底部
            </button>
            <div className={`place-index${placeMode === 'index' ? ' active' : ''}`}>
              <button
                type="button"
                className="wf-chip"
                onClick={() => setPlaceMode('index')}
              >
                指定位置
              </button>
              <span>第</span>
              <input
                className="wf-input place-input"
                type="number"
                min={1}
                max={table.drawPile + 1}
                value={placeIndex}
                onChange={(event) => {
                  setPlaceIndex(event.target.value);
                  setPlaceMode('index');
                }}
              />
              <span>张（1-{table.drawPile + 1}）</span>
            </div>
          </div>
        </Modal>
      ) : null}

      {dialog === 'log' ? (
        <Modal
          title="对局日志"
          width={440}
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
              关闭
            </button>
          }
        >
          <ul className="log-list log-list--full">
            {table.log.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {dialog === 'discardPile' ? (
        <Modal
          title="弃牌堆"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
              关闭
            </button>
          }
        >
          {table.discardCount <= 0 ? (
            <div className="wf-empty">弃牌堆为空。</div>
          ) : (
            <ul className="log-list">
              {['攻击（高潮）', '恩惠（调情）', '跳过（逃脱）', '洗混']
                .slice(0, Math.min(4, table.discardCount))
                .map((name) => (
                  <li key={name}>{name}</li>
                ))}
            </ul>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
