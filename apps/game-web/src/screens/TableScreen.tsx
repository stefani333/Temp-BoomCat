import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CARD_NAME_OPTIONS,
  cardDisplayName,
  type Card,
  type GameView,
} from '@bombcat/game-core';
import { CardView } from '../components/CardView';

export interface PlayExtras {
  targetPlayerId?: string;
  namedCardName?: string;
  discardCardId?: string;
}

interface TableScreenProps {
  view: GameView;
  onPlay: (cardIds: string[], extras: PlayExtras) => boolean;
  onDraw: () => boolean;
  onCounter: (useNope: boolean) => void;
  onFavorGive: (cardId: string) => void;
  onResolveBomb: (useDefuse: boolean) => void;
  onInsertBomb: (index: number) => void;
  onAckFuture: () => void;
}

type PlayKind = 'single' | 'comboTwo' | 'comboThree' | 'comboFive';
type Classification = { kind: PlayKind } | { error: string };
type PlayStep =
  | { phase: 'target'; kind: PlayKind }
  | { phase: 'name'; targetPlayerId: string }
  | { phase: 'discard' };

function classify(cards: Card[]): Classification {
  if (cards.length === 0) return { error: '请先选择要打出的卡牌' };
  if (cards.length === 1) {
    const card = cards[0] as Card;
    if (card.type === 'cat') return { error: '特殊猫咪不能单独打出，请组合使用' };
    if (card.type === 'bomb' || card.type === 'defuse' || card.type === 'nope') {
      return { error: '该卡牌不能主动打出' };
    }
    return { kind: 'single' };
  }
  if (cards.some((c) => c.type !== 'cat')) return { error: '组合只能由特殊猫咪组成' };
  if (cards.length === 2 || cards.length === 3) {
    const cat = cards[0]?.cat;
    if (!cat || cards.some((c) => c.cat !== cat)) return { error: '需要相同名称的特殊猫咪' };
    return { kind: cards.length === 2 ? 'comboTwo' : 'comboThree' };
  }
  if (cards.length === 5) {
    if (new Set(cards.map((c) => c.cat)).size !== 5) return { error: '五张组合需要名称各不相同' };
    return { kind: 'comboFive' };
  }
  return { error: '无效的组合数量' };
}

function playerName(view: GameView, playerId: string): string {
  return view.players.find((p) => p.id === playerId)?.name ?? '玩家';
}

export function TableScreen({
  view,
  onPlay,
  onDraw,
  onCounter,
  onFavorGive,
  onResolveBomb,
  onInsertBomb,
  onAckFuture,
}: TableScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [playStep, setPlayStep] = useState<PlayStep | null>(null);
  const [note, setNote] = useState('');
  const [insertValue, setInsertValue] = useState('1');
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const pending = view.pending;
  const me = view.myPlayerId;
  const opponents = view.players.filter((p) => p.id !== me);
  const discardTop = view.discardPile[view.discardPile.length - 1];
  const selectedCards = useMemo(
    () => selectedIds
      .map((id) => view.myHand.find((c) => c.id === id))
      .filter((c): c is Card => Boolean(c)),
    [selectedIds, view.myHand],
  );
  const classification = classify(selectedCards);
  const myDefuseCount = view.myHand.filter((c) => c.type === 'defuse').length;

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => view.myHand.some((c) => c.id === id)));
  }, [view.myHand]);

  useEffect(() => {
    setSelectedIds([]);
    setPlayStep(null);
    setNote('');
    setConfirmAbandon(false);
  }, [view.currentPlayerId, view.turnNumber, pending?.id]);

  useEffect(() => {
    if (pending?.awaiting === 'bombInsert') {
      setInsertValue(String(view.drawPileCount + 1));
    }
  }, [pending?.awaiting, pending?.id, view.drawPileCount]);

  const toggleCard = (cardId: string) => {
    if (!view.canAct) return;
    setSelectedIds((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 5) {
        setNote('最多一次选择 5 张卡牌');
        return prev;
      }
      return [...prev, cardId];
    });
  };

  const commit = (extras: PlayExtras) => {
    const ok = onPlay(selectedIds, extras);
    if (ok) {
      setSelectedIds([]);
      setPlayStep(null);
      setNote('');
    }
  };

  const handlePlayClick = () => {
    if (!view.canAct) return;
    const cards = selectedCards;
    if ('error' in classification) {
      setNote(classification.error);
      return;
    }
    if (classification.kind === 'comboFive') {
      if (view.discardPile.length === 0) {
        setNote('弃牌堆为空，不能打出五张不同猫咪组合');
        return;
      }
      setPlayStep({ phase: 'discard' });
      return;
    }
    if (classification.kind === 'single') {
      if (cards[0]?.type === 'favor') {
        setPlayStep({ phase: 'target', kind: 'single' });
        return;
      }
      commit({});
      return;
    }
    setPlayStep({ phase: 'target', kind: classification.kind });
  };

  const handleTarget = (targetPlayerId: string) => {
    if (!playStep || playStep.phase !== 'target') return;
    if (playStep.kind === 'comboThree') {
      setPlayStep({ phase: 'name', targetPlayerId });
      return;
    }
    commit({ targetPlayerId });
  };

  const insertPosition = Number(insertValue);
  const insertValid = Number.isInteger(insertPosition)
    && insertPosition >= 1
    && insertPosition <= view.drawPileCount + 1;

  return (
    <div className="game">
      <header className="game__header">
        <div>
          <p className="topbar__eyebrow">房间 {view.roomId} · 第 {view.turnNumber} 回合</p>
          <h2 className="game__turn">
            当前：{view.currentPlayerName}
            {view.isMyTurn ? <span className="tag tag--mine">你的回合</span> : null}
            {view.turnsRemaining > 1 ? <span className="tag tag--attack">剩余 {view.turnsRemaining} 回合</span> : null}
          </h2>
        </div>
        <div className="piles">
          <div className="pile">
            <span className="pile__label">抽牌堆</span>
            <span className="pile__value">{view.drawPileCount}</span>
          </div>
          <div className="pile">
            <span className="pile__label">弃牌堆</span>
            <span className="pile__value">{view.discardPile.length}</span>
          </div>
        </div>
      </header>

      <section className="opponents">
        {opponents.map((player) => (
          <div
            key={player.id}
            className={[
              'opponent',
              player.alive ? '' : 'opponent--out',
              player.isCurrent ? 'is-current' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="opponent__top">
              <strong>{player.name}</strong>
              <span>{player.alive ? '存活' : '已淘汰'}</span>
            </div>
            <div className="opponent__hand" aria-label={`手牌 ${player.handCount} 张`}>
              {Array.from({ length: Math.min(player.handCount, 6) }).map((_, index) => (
                <span key={index} className="mini-card" />
              ))}
              {player.handCount > 6 ? <span className="opponent__more">+{player.handCount - 6}</span> : null}
              {player.handCount === 0 ? <span className="opponent__empty">无手牌</span> : null}
            </div>
            <div className="opponent__foot">
              <span>手牌 {player.handCount}</span>
              {player.isCurrent ? <span className="opponent__turn">行动中</span> : null}
            </div>
          </div>
        ))}
      </section>

      <div className="table-main">
        <section className="board panel">
          <div className="board__piles">
            <div className="draw-stack" title="抽牌堆，仅显示数量">
              <span className="draw-stack__count">{view.drawPileCount}</span>
              <span className="draw-stack__label">抽牌堆</span>
            </div>
            <div className="discard-area">
              <span className="discard-area__label">弃牌堆顶</span>
              {discardTop ? (
                <CardView card={discardTop} compact disabled />
              ) : (
                <span className="discard-area__empty">暂无弃牌</span>
              )}
              <details className="discard-details">
                <summary>查看弃牌堆（{view.discardPile.length}）</summary>
                <ul>
                  {[...view.discardPile].reverse().slice(0, 15).map((card) => (
                    <li key={card.id}>{cardDisplayName(card)}</li>
                  ))}
                  {view.discardPile.length === 0 ? <li>暂无弃牌</li> : null}
                </ul>
              </details>
            </div>
          </div>

          {pending ? (
            <div className="pending-banner">
              <strong>待处理：{pendingLabelText(pending.kind)}</strong>
              <span>{pendingStatusText(view)}</span>
              {pending.counterDepth > 0 ? <span>反制层数 {pending.counterDepth}</span> : null}
            </div>
          ) : (
            <p className="board__hint">
              {view.canAct
                ? '选择手牌出牌，或直接抽牌结束本回合。'
                : `等待 ${view.currentPlayerName} 行动。`}
            </p>
          )}

          <div className="event-log">
            {view.events.slice(-40).map((event) => (
              <p key={event.seq} className={`event event--${event.kind}`}>
                <span>{String(event.seq).padStart(2, '0')}</span>
                {event.message}
              </p>
            ))}
          </div>
        </section>

        <section className="hand-zone panel">
          <div className="hand-zone__head">
            <h3>我的手牌（{view.myHand.length}）</h3>
            <span className={view.canAct ? 'status status--ok' : 'status'}>
              {view.canAct ? '可行动' : '等待中'}
            </span>
          </div>
          <div className="hand">
            {view.myHand.map((card) => (
              <CardView
                key={card.id}
                card={card}
                selected={selectedIds.includes(card.id)}
                disabled={!view.canAct}
                onClick={() => toggleCard(card.id)}
              />
            ))}
            {view.myHand.length === 0 ? <p className="hand__empty">暂无手牌，可直接抽牌。</p> : null}
          </div>

          {selectedCards.length > 0 ? (
            <div className="selection-hint">
              <span>已选 {selectedCards.length} 张：{selectedCards.map(cardDisplayName).join('、')}</span>
              <span className={'error' in classification ? 'hint hint--warn' : 'hint hint--ok'}>
                {'error' in classification ? classification.error : `可打出：${kindText(classification.kind)}`}
              </span>
            </div>
          ) : null}

          {note ? <p className="hint hint--warn">{note}</p> : null}

          <div className="hand-zone__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePlayClick}
              disabled={!view.canAct || selectedCards.length === 0}
            >
              出牌
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => onDraw()}
              disabled={!view.canAct || view.drawPileCount === 0}
            >
              抽牌并结束回合
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setSelectedIds([]);
                setPlayStep(null);
                setNote('');
              }}
              disabled={selectedCards.length === 0}
            >
              清空选择
            </button>
          </div>
          {view.drawPileCount === 0 ? <p className="hint hint--warn">抽牌堆为空，无法抽牌。</p> : null}
        </section>
      </div>

      {playStep?.phase === 'target' ? (
        <Modal title="选择目标玩家">
          <p className="modal__desc">
            {playStep.kind === 'single'
              ? '恩惠：目标玩家需自行选择一张手牌交给你。'
              : playStep.kind === 'comboTwo'
                ? '两张相同猫咪：从目标手牌中随机抽取一张。'
                : '三张相同猫咪：先选择目标，再指定卡牌名称。'}
          </p>
          <div className="target-list">
            {opponents.filter((p) => p.alive).map((player) => (
              <button
                key={player.id}
                type="button"
                className="target"
                disabled={player.handCount === 0}
                onClick={() => handleTarget(player.id)}
              >
                <strong>{player.name}</strong>
                <span>{player.handCount === 0 ? '无手牌，不可选择' : `手牌 ${player.handCount}`}</span>
              </button>
            ))}
          </div>
          <ModalActions onCancel={() => setPlayStep(null)} />
        </Modal>
      ) : null}

      {playStep?.phase === 'name' ? (
        <Modal title="指定卡牌名称">
          <p className="modal__desc">目标：{playerName(view, playStep.targetPlayerId)}</p>
          <p className="hint">手牌为空的玩家不可作为恩惠或猫咪组合的目标；炸弹猫不可作为指定名称。</p>
          <div className="name-grid">
            {CARD_NAME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className="btn btn--tiny"
                disabled={option.key === 'bomb'}
                onClick={() => commit({ targetPlayerId: playStep.targetPlayerId, namedCardName: option.key })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ModalActions onCancel={() => setPlayStep(null)} />
        </Modal>
      ) : null}

      {playStep?.phase === 'discard' ? (
        <Modal title="从弃牌堆选择一张牌">
          {view.discardPile.length === 0 ? (
            <p className="hint hint--warn">弃牌堆为空，无法执行该组合。</p>
          ) : (
            <div className="discard-picker">
              {[...view.discardPile].reverse().map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="btn btn--tiny"
                  onClick={() => commit({ discardCardId: card.id })}
                >
                  {cardDisplayName(card)}
                </button>
              ))}
            </div>
          )}
          <ModalActions onCancel={() => setPlayStep(null)} />
        </Modal>
      ) : null}

      {pending?.awaiting === 'counter' && pending.counterResponderId === me ? (
        <Modal title="是否使用休想">
          <p className="modal__desc">
            {pending.sourceName} 打出 {pending.playedCardLabels.join('、') || '卡牌效果'}，当前反制层数 {pending.counterDepth}。
            休想可以取消该效果，也可以被另一张休想反制。
          </p>
          {view.myHand.some((c) => c.type === 'nope') ? null : (
            <p className="hint hint--warn">你手牌中没有休想，只能放弃。</p>
          )}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!view.myHand.some((c) => c.type === 'nope')}
              onClick={() => onCounter(true)}
            >
              使用休想
            </button>
            <button type="button" className="btn btn--muted" onClick={() => onCounter(false)}>
              放弃
            </button>
          </div>
        </Modal>
      ) : null}

      {pending?.awaiting === 'favorGive' && pending.targetPlayerId === me ? (
        <Modal title="选择交给对方的手牌">
          <p className="modal__desc">{pending.sourceName} 对你使用恩惠，请选择一张手牌交出。</p>
          <div className="favor-picker">
            {view.myHand.map((card) => (
              <CardView key={card.id} card={card} compact onClick={() => onFavorGive(card.id)} />
            ))}
          </div>
          {view.myHand.length === 0 ? <p className="hint hint--warn">你没有手牌，无法交出。</p> : null}
        </Modal>
      ) : null}

      {pending?.awaiting === 'bombDecision' && pending.sourcePlayerId === me ? (
        <Modal title="你抽到了炸弹猫">
          <p className="modal__desc">
            使用一张拆除（消火）可避免淘汰，并秘密把炸弹猫放回抽牌堆。拆除处理不受休想影响。
          </p>
          <p className="hint">{myDefuseCount > 0 ? `手牌中有 ${myDefuseCount} 张拆除。` : '手牌中没有拆除，将被淘汰。'}</p>
          {confirmAbandon ? (
            <>
              <p className="hint hint--warn">
                确认放弃拆除将立即被淘汰，全部手牌与炸弹移出本局，操作不可撤销。
              </p>
              <div className="modal__actions">
                <button type="button" className="btn btn--danger" onClick={() => onResolveBomb(false)}>
                  确认淘汰
                </button>
                <button type="button" className="btn btn--muted" onClick={() => setConfirmAbandon(false)}>
                  取消
                </button>
              </div>
            </>
          ) : (
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={myDefuseCount === 0}
                onClick={() => onResolveBomb(true)}
              >
                使用拆除
              </button>
              <button type="button" className="btn btn--danger" onClick={() => setConfirmAbandon(true)}>
                放弃并淘汰
              </button>
            </div>
          )}
        </Modal>
      ) : null}

      {pending?.awaiting === 'bombInsert' && pending.sourcePlayerId === me ? (
        <Modal title="放回炸弹猫">
          <p className="modal__desc">
            选择炸弹猫在抽牌堆中的位置，该位置对其他玩家保密。当前抽牌堆 {view.drawPileCount} 张。
          </p>
          <div className="modal__actions">
            <button type="button" className="btn" onClick={() => onInsertBomb(0)}>
              牌堆顶部
            </button>
            <button type="button" className="btn" onClick={() => onInsertBomb(view.drawPileCount)}>
              牌堆底部
            </button>
          </div>
          <label className="field">
            <span>指定位置：第 1 张为顶部，第 {view.drawPileCount + 1} 张为底部</span>
            <input
              value={insertValue}
              inputMode="numeric"
              onChange={(event) => setInsertValue(event.target.value)}
            />
          </label>
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!insertValid}
              onClick={() => onInsertBomb(insertPosition - 1)}
            >
              确认放回
            </button>
          </div>
        </Modal>
      ) : null}

      {pending?.awaiting === 'seeFutureAck' && pending.sourcePlayerId === me ? (
        <Modal title="预见未来：抽牌堆顶部三张">
          <p className="modal__desc">只有你可以看到这三张牌，确认后按原顺序放回牌堆顶部。</p>
          <ol className="future-list">
            {(pending.seenCards ?? []).map((card) => (
              <li key={card.id}>{cardDisplayName(card)}</li>
            ))}
            {(pending.seenCards ?? []).length === 0 ? <li>抽牌堆为空</li> : null}
          </ol>
          <div className="modal__actions">
            <button type="button" className="btn btn--primary" onClick={onAckFuture}>
              知道了
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function pendingLabelText(kind: NonNullable<GameView['pending']>['kind']): string {
  switch (kind) {
    case 'favor': return '恩惠（调情）';
    case 'attack': return '攻击（高潮）';
    case 'skip': return '跳过（逃脱）';
    case 'shuffle': return '洗混（搅乱）';
    case 'seeFuture': return '预见未来（幻觉）';
    case 'comboTwo': return '两张相同猫咪';
    case 'comboThree': return '三张相同猫咪';
    case 'comboFive': return '五张不同猫咪';
    case 'bomb': return '炸弹猫';
    default: return '卡牌效果';
  }
}

function pendingStatusText(view: GameView): string {
  const pending = view.pending;
  if (!pending) return '';
  const who = (id?: string) => (id ? playerName(view, id) : '玩家');
  switch (pending.awaiting) {
    case 'counter':
      return `等待 ${who(pending.counterResponderId)} 决定是否使用休想`;
    case 'favorGive':
      return `等待 ${who(pending.targetPlayerId)} 选择交出的手牌`;
    case 'bombDecision':
      return `等待 ${who(pending.sourcePlayerId)} 决定是否使用拆除`;
    case 'bombInsert':
      return `等待 ${who(pending.sourcePlayerId)} 秘密选择放回位置`;
    case 'seeFutureAck':
      return `等待 ${who(pending.sourcePlayerId)} 查看结果`;
    default:
      return '';
  }
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

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="modal__actions">
      <button type="button" className="btn btn--muted" onClick={onCancel}>
        取消
      </button>
    </div>
  );
}
