import { useEffect, useMemo, useRef, useState } from 'react';
import { displayName } from '../game';
import type { CardKind, HandCard, OverlayKind, TableState } from '../types';
import { Modal } from '../ui';

type PlayKind = 'single' | 'comboTwo' | 'comboThree' | 'comboFive';
type Classification = { kind: PlayKind } | { error: string };

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

const DISCARD_CARDS = ['跳过（逃脱）', '恩惠（调情）', '洗混（搅乱）', '预见未来（幻觉）'];

const LEGACY_OVERLAYS: OverlayKind[] = ['play', 'combo', 'comboError', 'log'];

function classify(cards: HandCard[]): Classification {
  if (cards.length === 0) return { error: '请先选择要打出的卡牌' };
  if (cards.length === 1) {
    const card = cards[0]!;
    if (card.kind === 'cat') return { error: '特殊猫咪不能单独打出，请组合使用' };
    if (card.kind === 'bomb' || card.kind === 'defuse' || card.kind === 'nope') {
      return { error: '该卡牌不能主动打出' };
    }
    return { kind: 'single' };
  }
  if (cards.some((card) => card.kind !== 'cat')) {
    return { error: '组合只能由特殊猫咪组成' };
  }
  if (cards.length === 2 || cards.length === 3) {
    const firstName = cards[0]!.name;
    if (cards.some((card) => card.name !== firstName)) {
      return { error: '需要相同名称的特殊猫咪' };
    }
    return { kind: cards.length === 2 ? 'comboTwo' : 'comboThree' };
  }
  if (cards.length === 5) {
    if (new Set(cards.map((card) => card.name)).size !== 5) {
      return { error: '五张组合需要名称各不相同' };
    }
    return { kind: 'comboFive' };
  }
  return { error: '无效的组合数量' };
}

function kindText(kind: PlayKind): string {
  switch (kind) {
    case 'single': return '单张卡牌';
    case 'comboTwo': return '两张相同猫咪';
    case 'comboThree': return '三张相同猫咪';
    case 'comboFive': return '五张不同猫咪';
    default: return '卡牌';
  }
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
  const [targetId, setTargetId] = useState(
    () => table.seats.find((seat) => seat.alive && seat.id !== 'p1')?.id ?? '',
  );
  const [named, setNamed] = useState('');
  const [insertValue, setInsertValue] = useState(String(table.drawPile + 1));
  const [giveUpConfirm, setGiveUpConfirm] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(initialOverlay === 'discardPile');
  const logRef = useRef<HTMLDivElement | null>(null);
  const logFollowRef = useRef(true);

  const me = table.seats.find((seat) => seat.id === 'p1');
  const myAlive = me?.alive ?? true;
  const current = table.seats.find((seat) => seat.id === table.currentId);
  const canAct = table.currentId === 'p1' && myAlive;
  const opponents = table.seats.filter((seat) => seat.id !== 'p1');
  const selectedCards = useMemo(
    () => selected
      .map((id) => table.hand.find((card) => card.id === id))
      .filter((card): card is HandCard => Boolean(card)),
    [selected, table.hand],
  );
  const classification = classify(selectedCards);
  const hasDefuse = table.hand.some((card) => card.kind === 'defuse');
  const aliveOpponents = opponents.filter((seat) => seat.alive);
  const targetName =
    table.seats.find((seat) => seat.id === targetId)?.name ?? aliveOpponents[0]?.name ?? '模拟玩家 A';
  const selectedLabel = selectedCards.length === 0
    ? '未选择'
    : selectedCards.map((card) => displayName(card)).join('、');
  const legacy = LEGACY_OVERLAYS.includes(initialOverlay ?? null);

  const insertPosition = Number(insertValue);
  const insertValid =
    Number.isInteger(insertPosition)
    && insertPosition >= 1
    && insertPosition <= table.drawPile + 1;

  useEffect(() => {
    const element = logRef.current;
    if (!element || !logFollowRef.current) return;
    element.scrollTop = element.scrollHeight;
  }, [table.log.length]);

  const toggleCard = (cardId: string) => {
    if (!canAct) return;
    setSelected((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 5) {
        setNote('最多一次选择 5 张卡牌');
        return prev;
      }
      return [...prev, cardId];
    });
  };

  const commit = (message: string, patch: Partial<TableState> = {}) => {
    const ids = new Set(selected);
    onUpdate({
      hand: table.hand.filter((card) => !ids.has(card.id)),
      log: [...table.log, message],
      ...patch,
    });
    setSelected([]);
    setDialog(null);
    setNote('');
  };

  const handlePlay = () => {
    if (!canAct) return;
    if ('error' in classification) {
      setNote(classification.error);
      return;
    }
    if (classification.kind === 'comboFive') {
      if (table.discardCount === 0) {
        setNote('弃牌堆为空，不能打出五张不同猫咪组合');
        return;
      }
      setDialog('discard');
      return;
    }
    if (classification.kind === 'single') {
      const card = selectedCards[0]!;
      if (card.name === '恩惠') {
        setDialog('target');
        return;
      }
      if (card.name === '预见未来') {
        const ids = new Set(selected);
        onUpdate({
          hand: table.hand.filter((item) => !ids.has(item.id)),
          log: [...table.log, '我使用预见未来（幻觉），查看牌堆顶部三张'],
        });
        setSelected([]);
        setDialog('foresee');
        return;
      }
      commit(`我打出「${displayName(card)}」`);
      return;
    }
    setDialog('target');
  };

  const handleTarget = (playerId: string) => {
    setTargetId(playerId);
    const target = table.seats.find((seat) => seat.id === playerId);
    if (!target) return;
    if ('kind' in classification && classification.kind === 'comboThree') {
      setDialog('guess');
      return;
    }
    const played = selectedCards.length > 1
      ? `${selectedCards[0]!.name} ×${selectedCards.length}`
      : selectedCards[0]
        ? displayName(selectedCards[0])
        : '组合';
    commit(`我打出 ${played}，目标：${target.name}`);
  };

  const handleGuess = (name: string) => {
    setNamed(name);
    commit(`我打出三张相同猫咪，目标：${targetName}，指定卡牌：${name}`);
  };

  const handleDiscard = (name: string) => {
    commit(`我打出五张不同猫咪，从弃牌堆选择：${name}`);
  };

  const handleFavorGive = (name: string) => {
    onUpdate({ log: [...table.log, `我向 ${targetName} 交出一张手牌：${name}`] });
    setDialog(null);
  };

  const handleCounter = (useNope: boolean) => {
    onUpdate({
      log: [
        ...table.log,
        useNope ? '我使用休想，取消该卡牌效果' : '我放弃使用休想',
      ],
    });
    setDialog(null);
    setNote(useNope ? '休想已生效，卡牌效果被取消。' : '已放弃响应，卡牌效果生效。');
  };

  const handleUseDefuse = () => {
    const defuse = table.hand.find((card) => card.kind === 'defuse');
    if (!defuse) return;
    onUpdate({
      hand: table.hand.filter((card) => card.id !== defuse.id),
      log: [...table.log, '我使用拆除（消火），避免淘汰'],
    });
    setDialog('bombPlace');
  };

  const handleGiveUp = () => {
    onUpdate({
      seats: table.seats.map((seat) => (seat.id === 'p1' ? { ...seat, alive: false, handCount: 0 } : seat)),
      hand: [],
      log: [...table.log, '我放弃使用拆除，被淘汰，全部手牌移出本局'],
    });
    setGiveUpConfirm(false);
    setDialog('eliminated');
    setNote('');
  };

  const handleBombInsert = (position: number) => {
    const label = position <= 0
      ? '牌堆顶部'
      : position >= table.drawPile
        ? '牌堆底部'
        : `第 ${position + 1} 张`;
    onUpdate({ log: [...table.log, `炸弹猫已秘密放回：${label}`] });
    setDialog(null);
    setNote(`炸弹猫已放回：${label}。`);
  };

  const handleDraw = () => {
    if (!canAct) return;
    if (table.drawPile <= 0) {
      setNote('抽牌堆为空，无法抽牌。');
      return;
    }
    const alive = table.seats.filter((seat) => seat.alive);
    const index = alive.findIndex((seat) => seat.id === table.currentId);
    const next = alive[(index + 1) % alive.length];
    onUpdate({
      drawPile: table.drawPile - 1,
      currentId: next?.id ?? table.currentId,
      log: [
        ...table.log,
        '我抽了一张牌，回合结束',
        next ? `当前玩家：${next.name}` : '当前玩家：我',
      ],
    });
    setSelected([]);
    setNote(next ? `已抽牌，等待 ${next.name} 行动。` : '已抽牌，回合结束。');
  };

  return (
    <div className="wf-screen table-screen">
      {legacy ? (
        <div className="g-legacy-banner">
          线框保留场景：当前实现无此浮层或入口，以下内容仅作历史线框记录。
        </div>
      ) : null}

      <header className="g-head">
        <div className="g-head-info">
          <p className="wf-subtitle">房间 {table.roomId} · 第 {table.round} 回合</p>
          <h2 className="g-turn">
            当前：{current?.name ?? '—'}
            {canAct ? <span className="wf-tag wf-tag--mine">你的回合</span> : null}
            {table.remainingTurns > 1 ? (
              <span className="wf-tag">剩余 {table.remainingTurns} 回合</span>
            ) : null}
          </h2>
          {!myAlive ? <p className="wf-help wf-help--warn">你已被淘汰，正在观战。</p> : null}
        </div>
        <div className="g-piles">
          <div className="g-pile">
            <span className="g-pile-label">抽牌堆</span>
            <strong className="g-pile-value">{table.drawPile}</strong>
          </div>
          <div className="g-pile">
            <span className="g-pile-label">弃牌堆</span>
            <strong className="g-pile-value">{table.discardCount}</strong>
          </div>
        </div>
      </header>

      <section className="g-opponents">
        {opponents.map((seat) => (
          <div
            key={seat.id}
            className={[
              'g-opponent',
              seat.alive ? '' : 'is-out',
              seat.id === table.currentId ? 'is-current' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="g-opp-top">
              <strong>{seat.name}</strong>
              <span>{seat.alive ? '存活' : '已淘汰'}</span>
            </div>
            <div className="g-opp-hand">
              {Array.from({ length: Math.min(seat.handCount, 6) }).map((_, index) => (
                <span key={index} className="g-mini-card" />
              ))}
              {seat.handCount > 6 ? <span className="g-opp-more">+{seat.handCount - 6}</span> : null}
              {seat.handCount === 0 ? <span className="g-opp-empty">无手牌</span> : null}
            </div>
            <div className="g-opp-foot">
              <span>手牌 {seat.handCount}</span>
              {seat.id === table.currentId ? <span className="g-opp-turn">行动中</span> : null}
            </div>
          </div>
        ))}
      </section>

      <div className="g-main">
        <section className="g-board wf-panel">
          <div className="g-piles-row">
            <div className="g-draw">
              <strong>{table.drawPile}</strong>
              <span>抽牌堆</span>
            </div>
            <div className="g-discard">
              <span className="wf-label">弃牌堆顶</span>
              <div className="g-discard-card">
                {table.discardCount > 0 ? table.discardTop : '暂无弃牌'}
              </div>
              <details
                className="g-discard-details"
                open={discardOpen}
                onToggle={(event) => setDiscardOpen(event.currentTarget.open)}
              >
                <summary>查看弃牌堆（{table.discardCount}）</summary>
                <ul>
                  {table.discardCount === 0 ? <li>暂无弃牌</li> : null}
                  {DISCARD_CARDS.slice(0, Math.min(DISCARD_CARDS.length, table.discardCount)).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          {table.pendingLabel ? (
            <div className="g-pending">
              <strong>待处理：{table.pendingLabel}</strong>
              <span>{table.pendingStatus}</span>
              {table.counterDepth ? <span>反制层数 {table.counterDepth}</span> : null}
            </div>
          ) : (
            <p className="wf-help">
              {canAct ? '选择手牌出牌，或直接抽牌结束本回合。' : `等待 ${current?.name ?? '当前玩家'} 行动。`}
            </p>
          )}

          <div
            className="g-log"
            ref={logRef}
            onScroll={(event) => {
              const element = event.currentTarget;
              logFollowRef.current =
                element.scrollHeight - element.scrollTop - element.clientHeight < 24;
            }}
          >
            {table.log.map((line, index) => (
              <p className="g-event" key={`${line}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {line}
              </p>
            ))}
          </div>
        </section>

        <section className="g-hand-zone wf-panel">
          <div className="g-hand-head">
            <h3>我的手牌（{table.hand.length}）</h3>
            <span className={canAct ? 'g-status g-status--ok' : 'g-status'}>
              {canAct ? '可行动' : '等待中'}
            </span>
          </div>
          <div className="hand">
            {table.hand.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`hand-card${selected.includes(card.id) ? ' hand-card--selected' : ''}`}
                onClick={() => toggleCard(card.id)}
                disabled={!canAct}
              >
                <span className="hand-card-kind">{KIND_LABEL[card.kind]}</span>
                <span className="hand-card-name">{card.name}</span>
                <span className="hand-card-effect">{card.effect}</span>
              </button>
            ))}
            {table.hand.length === 0 ? <p className="g-empty-hand">暂无手牌，可直接抽牌。</p> : null}
          </div>

          {selectedCards.length > 0 ? (
            <div className="g-selection">
              <span>已选 {selectedCards.length} 张：{selectedLabel}</span>
              <span className={'error' in classification ? 'wf-help wf-help--warn' : 'wf-help wf-help--ok'}>
                {'error' in classification ? classification.error : `可打出：${kindText(classification.kind)}`}
              </span>
            </div>
          ) : null}

          {note ? <p className="wf-hint wf-hint--warn">{note}</p> : null}

          <div className="g-hand-actions">
            <button
              type="button"
              className="wf-btn primary"
              onClick={handlePlay}
              disabled={!canAct || selectedCards.length === 0}
            >
              出牌
            </button>
            <button
              type="button"
              className="wf-btn accent"
              onClick={handleDraw}
              disabled={!canAct || table.drawPile === 0}
            >
              抽牌并结束回合
            </button>
            <button
              type="button"
              className="wf-btn ghost"
              onClick={() => {
                setSelected([]);
                setNote('');
              }}
              disabled={selectedCards.length === 0}
            >
              清空选择
            </button>
          </div>
          {table.drawPile === 0 ? <p className="wf-hint wf-hint--warn">抽牌堆为空，无法抽牌。</p> : null}
        </section>
      </div>

      {dialog === 'target' ? (
        <Modal
          title="选择目标玩家"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
              取消
            </button>
          }
        >
          <p className="wf-dialog-desc">
            {'kind' in classification && classification.kind === 'single'
              ? '恩惠：目标玩家需自行选择一张手牌交给你。'
              : 'kind' in classification && classification.kind === 'comboTwo'
                ? '两张相同猫咪：从目标手牌中随机抽取一张。'
                : '三张相同猫咪：先选择目标，再指定卡牌名称。'}
          </p>
          <div className="target-list">
            {aliveOpponents.map((seat) => (
              <button
                key={seat.id}
                type="button"
                className={`target-row${targetId === seat.id ? ' active' : ''}`}
                disabled={seat.handCount === 0}
                onClick={() => handleTarget(seat.id)}
              >
                <strong>{seat.name}</strong>
                <span>{seat.handCount === 0 ? '无手牌，不可选择' : `手牌 ${seat.handCount}`}</span>
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {dialog === 'guess' ? (
        <Modal
          title="指定卡牌名称"
          width={420}
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
              取消
            </button>
          }
        >
          <p className="wf-dialog-desc">目标：{targetName}</p>
          <p className="wf-help">手牌为空的玩家不可作为恩惠或猫咪组合的目标；炸弹猫不可作为指定名称。</p>
          <div className="name-grid">
            {GUESS_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className="wf-btn small"
                disabled={name === '炸弹猫'}
                onClick={() => handleGuess(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {dialog === 'discard' ? (
        <Modal
          title="从弃牌堆选择一张牌"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
              取消
            </button>
          }
        >
          {table.discardCount === 0 ? (
            <p className="wf-hint wf-hint--warn">弃牌堆为空，无法执行该组合。</p>
          ) : (
            <div className="discard-picker">
              {DISCARD_CARDS.slice(0, Math.min(DISCARD_CARDS.length, table.discardCount)).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="wf-btn small"
                  onClick={() => handleDiscard(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </Modal>
      ) : null}

      {dialog === 'counter' ? (
        <Modal
          title="是否使用休想"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button
                type="button"
                className="wf-btn primary"
                disabled
                title="手牌中没有休想"
              >
                使用休想
              </button>
              <button type="button" className="wf-btn" onClick={() => handleCounter(false)}>
                放弃
              </button>
            </>
          }
        >
          <p className="wf-dialog-desc">
            模拟玩家 A 打出 攻击（高潮），当前反制层数 1。休想可以取消该效果，也可以被另一张休想反制。
          </p>
          <p className="wf-hint wf-hint--warn">你手牌中没有休想，只能放弃。</p>
        </Modal>
      ) : null}

      {dialog === 'favorGive' ? (
        <Modal
          title="选择交给对方的手牌"
          onClose={() => setDialog(null)}
        >
          <p className="wf-dialog-desc">模拟玩家 A 对你使用恩惠，请选择一张手牌交出。</p>
          <div className="favor-picker">
            {table.hand.map((card) => (
              <button
                key={card.id}
                type="button"
                className="hand-card"
                onClick={() => handleFavorGive(displayName(card))}
              >
                <span className="hand-card-kind">{KIND_LABEL[card.kind]}</span>
                <span className="hand-card-name">{card.name}</span>
              </button>
            ))}
          </div>
          {table.hand.length === 0 ? <p className="wf-hint wf-hint--warn">你没有手牌，无法交出。</p> : null}
        </Modal>
      ) : null}

      {dialog === 'bomb' ? (
        <Modal
          title="你抽到了炸弹猫"
          onClose={() => setDialog(null)}
          footer={
            giveUpConfirm ? (
              <>
                <button type="button" className="wf-btn primary" onClick={handleGiveUp}>
                  确认淘汰
                </button>
                <button type="button" className="wf-btn" onClick={() => setGiveUpConfirm(false)}>
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="wf-btn primary"
                  onClick={handleUseDefuse}
                  disabled={!hasDefuse}
                >
                  使用拆除
                </button>
                <button type="button" className="wf-btn" onClick={() => setGiveUpConfirm(true)}>
                  放弃并淘汰
                </button>
              </>
            )
          }
        >
          <p className="wf-dialog-desc">
            使用一张拆除（消火）可避免淘汰，并秘密把炸弹猫放回抽牌堆。拆除处理不受休想影响。
          </p>
          <p className="wf-hint">
            {hasDefuse ? `手牌中有 ${table.hand.filter((card) => card.kind === 'defuse').length} 张拆除。` : '手牌中没有拆除，将被淘汰。'}
          </p>
          {giveUpConfirm ? (
            <p className="wf-hint wf-hint--warn">
              确认放弃拆除将立即被淘汰，全部手牌与炸弹移出本局，操作不可撤销。
            </p>
          ) : null}
        </Modal>
      ) : null}

      {dialog === 'bombPlace' ? (
        <Modal
          title="放回炸弹猫"
          onClose={() => setDialog(null)}
          footer={
            <button
              type="button"
              className="wf-btn primary"
              onClick={() => handleBombInsert(insertPosition - 1)}
              disabled={!insertValid}
            >
              确认放回
            </button>
          }
        >
          <p className="wf-dialog-desc">
            选择炸弹猫在抽牌堆中的位置，该位置对其他玩家保密。当前抽牌堆 {table.drawPile} 张。
          </p>
          <div className="place-options">
            <button type="button" className="wf-btn" onClick={() => handleBombInsert(0)}>
              牌堆顶部
            </button>
            <button type="button" className="wf-btn" onClick={() => handleBombInsert(table.drawPile)}>
              牌堆底部
            </button>
          </div>
          <label className="wf-field">
            <span className="wf-label">
              指定位置：第 1 张为顶部，第 {table.drawPile + 1} 张为底部
            </span>
            <input
              className="wf-input"
              value={insertValue}
              inputMode="numeric"
              onChange={(event) => setInsertValue(event.target.value)}
            />
          </label>
        </Modal>
      ) : null}

      {dialog === 'eliminated' ? (
        <Modal
          title="你已被淘汰"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
              继续观战
            </button>
          }
        >
          <p className="wf-dialog-desc">
            你抽到炸弹猫且没有打出拆除，已退出本局。你的手牌已移出，无法继续出牌或抽牌。
          </p>
          <p className="wf-hint">对局仍在进行，你可以继续观战直到结算。</p>
        </Modal>
      ) : null}

      {dialog === 'foresee' ? (
        <Modal
          title="预见未来：抽牌堆顶部三张"
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
              知道了
            </button>
          }
        >
          <p className="wf-dialog-desc">只有你可以看到这三张牌，确认后按原顺序放回牌堆顶部。</p>
          <ol className="future-list">
            <li>炸弹猫</li>
            <li>跳过（逃脱）</li>
            <li>薯条猫咪</li>
          </ol>
        </Modal>
      ) : null}

      {dialog === 'play' && selectedCards[0] ? (
        <Modal
          title="出牌"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className="wf-btn" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
                确定打出
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
              <button type="button" className="wf-btn primary" onClick={() => setDialog(null)}>
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
            {selectedCards.length === 2 ? '两张相同猫咪' : selectedCards.length === 3 ? '三张相同猫咪' : '五张不同猫咪'}
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
          <p className="wf-dialog-desc">
            所选卡牌不构成有效组合，请选择两张相同、三张相同或五张不同的特殊猫咪。
          </p>
          <p className="wf-help">有效组合：两张相同、三张相同或五张不同的特殊猫咪。</p>
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
    </div>
  );
}
