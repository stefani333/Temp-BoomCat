import {
  CARD_LABELS,
  CAT_LABELS,
  CARD_NAME_OPTIONS,
  buildDeck,
  cardDisplayName,
  cardNameKey,
  type Card,
  type CardType,
  type GameAction,
  type GameState,
  type PendingAction,
  type PendingKind,
  type Player,
  type ActionResult,
} from './types';
import { createRngState, nextRandom, randomInt, shuffleInPlace } from './rng';

const BOMB_COUNTS: Record<number, number> = { 2: 2, 3: 2, 4: 3, 5: 4 };

export interface CreateRoomOptions {
  hostName?: string;
  targetPlayerCount: 2 | 3 | 4 | 5;
  seed?: number;
  roomId?: string;
  hostIsBot?: boolean;
}

const PLAYABLE_SINGLE: CardType[] = ['favor', 'attack', 'skip', 'shuffle', 'seeFuture'];

function createPlayer(id: string, seat: number, name: string, isBot: boolean, isHost: boolean): Player {
  return {
    id,
    seat,
    name,
    isBot,
    isHost,
    ready: false,
    alive: true,
    hand: [],
  };
}

function createInitialState(options: CreateRoomOptions): GameState {
  const seed = (options.seed ?? Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const roomId = options.roomId ?? 'LOCAL-0001';
  const hostIsBot = options.hostIsBot ?? false;
  const host = createPlayer('p1', 1, options.hostName?.trim() || '我', hostIsBot, true);
  host.ready = hostIsBot;
  return {
    gameId: `game-${seed.toString(16)}`,
    roomId,
    phase: 'lobby',
    players: [host],
    drawPile: [],
    discardPile: [],
    removedPile: [],
    currentPlayerId: null,
    turnsRemaining: 1,
    turnNumber: 0,
    cardsPlayedThisTurn: 0,
    pending: null,
    winnerPlayerId: null,
    hostId: host.id,
    targetPlayerCount: options.targetPlayerCount,
    startPlayerId: null,
    eventLog: [],
    rngState: createRngState(seed),
    stepCount: 0,
    processedActionIds: [],
  };
}

function sortBySeat(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.seat - b.seat);
}

function pendingLabel(pending: PendingAction): string {
  switch (pending.kind) {
    case 'favor':
      return '「恩惠（调情）」';
    case 'attack':
      return '「攻击（高潮）」';
    case 'skip':
      return '「跳过（逃脱）」';
    case 'shuffle':
      return '「洗混（搅乱）」';
    case 'seeFuture':
      return '「预见未来（幻觉）」';
    case 'comboTwo':
      return '「两张相同猫咪」组合';
    case 'comboThree':
      return '「三张相同猫咪」组合';
    case 'comboFive':
      return '「五张不同猫咪」组合';
    case 'bomb':
      return '炸弹猫处理';
    default:
      return '卡牌效果';
  }
}

export class GameEngine {
  state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  static createRoom(options: CreateRoomOptions): GameEngine {
    const engine = new GameEngine(createInitialState(options));
    engine.logEvent('room', `创建房间，目标人数 ${options.targetPlayerCount} 人`);
    return engine;
  }

  private fork(): GameEngine {
    return new GameEngine(structuredClone(this.state));
  }

  private player(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  private alivePlayers(): Player[] {
    return sortBySeat(this.state.players.filter((p) => p.alive));
  }

  private nextAliveFrom(seat: number): Player | undefined {
    const alive = this.alivePlayers();
    if (alive.length === 0) return undefined;
    const after = alive.filter((p) => p.seat > seat);
    return after[0] ?? alive[0];
  }

  logEvent(kind: string, message: string, privateTo?: string): void {
    this.state.eventLog.push({
      seq: this.state.eventLog.length + 1,
      kind,
      message,
      ...(privateTo ? { privateTo } : {}),
    });
  }

  private fail(error: string): ActionResult {
    return { ok: false, error };
  }

  apply(action: GameAction, actionId?: string): ActionResult {
    if (actionId) {
      if (this.state.processedActionIds.includes(actionId)) {
        return { ok: true };
      }
      this.state.processedActionIds.push(actionId);
    }
    this.state.stepCount += 1;
    switch (action.type) {
      case 'JOIN_ROOM':
        return this.joinRoom(action);
      case 'SET_READY':
        return this.setReady(action);
      case 'SET_START_PLAYER':
        return this.setStartPlayer(action);
      case 'START_GAME':
        return this.startGame(action);
      case 'PLAY_CARD':
        return this.playCard(action);
      case 'DRAW_CARD':
        return this.drawCard(action);
      case 'RESPOND_COUNTER':
        return this.respondCounter(action);
      case 'CHOOSE_FAVOR_CARD':
        return this.chooseFavorCard(action);
      case 'RESOLVE_BOMB':
        return this.resolveBomb(action);
      case 'CHOOSE_BOMB_INSERT':
        return this.chooseBombInsert(action);
      case 'ACK_SEE_FUTURE':
        return this.ackSeeFuture(action);
      default:
        return this.fail('未知操作');
    }
  }

  private joinRoom(action: Extract<GameAction, { type: 'JOIN_ROOM' }>): ActionResult {
    if (this.state.phase !== 'lobby') return this.fail('对局已开始，无法加入');
    if (this.state.players.length >= this.state.targetPlayerCount) return this.fail('房间人数已满');
    const seat = this.state.players.length + 1;
    const id = action.playerId ?? `p${seat}`;
    if (this.player(id)) return this.fail('玩家 ID 重复');
    const fallbackName = action.isBot ? `模拟玩家 ${String.fromCharCode(64 + seat)}` : `玩家 ${seat}`;
    const player = createPlayer(id, seat, action.name?.trim() || fallbackName, action.isBot, false);
    player.ready = action.isBot;
    this.state.players.push(player);
    this.logEvent('room', `${player.name} 加入房间`);
    return { ok: true };
  }

  private setReady(action: Extract<GameAction, { type: 'SET_READY' }>): ActionResult {
    if (this.state.phase !== 'lobby') return this.fail('对局已开始');
    const player = this.player(action.playerId);
    if (!player) return this.fail('玩家不存在');
    player.ready = action.ready;
    this.logEvent('room', `${player.name} ${action.ready ? '已准备' : '取消准备'}`);
    return { ok: true };
  }

  private setStartPlayer(action: Extract<GameAction, { type: 'SET_START_PLAYER' }>): ActionResult {
    if (this.state.phase !== 'lobby') return this.fail('对局已开始');
    if (action.playerId !== this.state.hostId) return this.fail('仅房主可以指定起始玩家');
    const target = this.player(action.startPlayerId);
    if (!target) return this.fail('起始玩家不在房间内');
    this.state.startPlayerId = target.id;
    this.logEvent('room', `房主指定 ${target.name} 为起始玩家`);
    return { ok: true };
  }

  private startBlockReason(): string | null {
    if (this.state.phase !== 'lobby') return '对局已开始';
    if (this.state.players.length < this.state.targetPlayerCount) return '人数不足';
    if (this.state.players.some((p) => !p.ready)) return '有玩家未准备';
    if (!this.state.startPlayerId) return '请指定起始玩家';
    if (!this.player(this.state.startPlayerId)) return '起始玩家不在房间内';
    return null;
  }

  private startGame(action: Extract<GameAction, { type: 'START_GAME' }>): ActionResult {
    if (action.playerId !== this.state.hostId) return this.fail('仅房主可以开始游戏');
    const reason = this.startBlockReason();
    if (reason) return this.fail(reason);
    this.state.phase = 'playing';
    this.setupDeck();
    this.state.currentPlayerId = this.state.startPlayerId;
    this.state.turnsRemaining = 1;
    this.state.turnNumber = 1;
    this.state.cardsPlayedThisTurn = 0;
    const startPlayer = this.player(this.state.startPlayerId ?? '');
    this.logEvent('game', `对局开始，共 ${this.state.players.length} 人，起始玩家 ${startPlayer?.name ?? ''}`);
    return { ok: true };
  }

  private setupDeck(): void {
    const state = this.state;
    const playerCount = state.players.length;
    const deck = buildDeck();
    const bombs = deck.filter((c) => c.type === 'bomb');
    const defuses = deck.filter((c) => c.type === 'defuse');
    const rest = deck.filter((c) => c.type !== 'bomb' && c.type !== 'defuse');
    shuffleInPlace(rest, state);
    for (const player of state.players) {
      player.hand = [];
      for (let i = 0; i < 4; i += 1) {
        const card = rest.shift();
        if (card) player.hand.push(card);
      }
    }
    for (const player of state.players) {
      const defuse = defuses.shift();
      if (defuse) player.hand.push(defuse);
    }
    const bombBack = BOMB_COUNTS[playerCount] ?? 2;
    const bombsBack = bombs.splice(0, bombBack);
    const defuseBack = playerCount === 2 ? 2 : defuses.length;
    const defusesBack = defuses.splice(0, defuseBack);
    state.removedPile.push(...bombs, ...defuses);
    state.drawPile = [...rest, ...bombsBack, ...defusesBack];
    shuffleInPlace(state.drawPile, state);
    this.logEvent('game', `按 ${playerCount} 人局组牌，抽牌堆 ${state.drawPile.length} 张`);
  }

  private playCard(action: Extract<GameAction, { type: 'PLAY_CARD' }>): ActionResult {
    if (this.state.phase !== 'playing') return this.fail('对局未在进行中');
    if (this.state.pending) return this.fail('请先处理当前待处理的效果');
    if (this.state.currentPlayerId !== action.playerId) return this.fail('不是当前玩家的回合');
    const player = this.player(action.playerId);
    if (!player || !player.alive) return this.fail('玩家已淘汰');

    const ids = [...new Set(action.cardIds)];
    if (ids.length === 0) return this.fail('请选择要打出的卡牌');
    const cards: Card[] = [];
    for (const id of ids) {
      const card = player.hand.find((c) => c.id === id);
      if (!card) return this.fail('选择的卡牌不在手牌中');
      cards.push(card);
    }

    let kind: PendingKind | 'single';
    if (cards.length === 1) {
      const card = cards[0] as Card;
      if (!PLAYABLE_SINGLE.includes(card.type)) {
        return this.fail(card.type === 'cat' ? '特殊猫咪不能单独打出' : '该卡牌不能主动打出');
      }
      kind = 'single';
    } else {
      if (cards.some((c) => c.type !== 'cat')) return this.fail('组合只能由特殊猫咪组成');
      if (cards.length === 2 || cards.length === 3) {
        const firstCat = cards[0]?.cat;
        if (!firstCat || cards.some((c) => c.cat !== firstCat)) return this.fail('需要相同名称的特殊猫咪');
        kind = cards.length === 2 ? 'comboTwo' : 'comboThree';
      } else if (cards.length === 5) {
        const names = new Set(cards.map((c) => c.cat));
        if (names.size !== 5) return this.fail('五张组合需要名称各不相同');
        kind = 'comboFive';
      } else {
        return this.fail('无效的组合数量');
      }
    }

    const needsTarget = kind === 'single'
      ? (cards[0] as Card).type === 'favor'
      : kind === 'comboTwo' || kind === 'comboThree';
    let target: Player | undefined;
    if (needsTarget) {
      if (!action.targetPlayerId) return this.fail('请选择目标玩家');
      target = this.player(action.targetPlayerId);
      if (!target || !target.alive) return this.fail('目标玩家无效');
      if (target.id === player.id) return this.fail('不能选择自己作为目标');
      if (target.hand.length === 0) return this.fail('目标玩家没有手牌，不能选择');
    }

    if (kind === 'comboThree') {
      if (!action.namedCardName) return this.fail('请指定一种卡牌名称');
      if (action.namedCardName === 'bomb') return this.fail('不能指定炸弹猫');
      if (!CARD_NAME_OPTIONS.some((option) => option.key === action.namedCardName)) {
        return this.fail('指定的卡牌名称无效');
      }
    }

    let discardCard: Card | undefined;
    if (kind === 'comboFive') {
      if (!action.discardCardId) return this.fail('请从弃牌堆选择一张卡牌');
      discardCard = this.state.discardPile.find((c) => c.id === action.discardCardId);
      if (!discardCard) return this.fail('选择的弃牌不存在');
    }

    const idSet = new Set(ids);
    player.hand = player.hand.filter((c) => !idSet.has(c.id));
    this.state.discardPile.push(...cards);

    const pendingKind: PendingKind =
      kind === 'single' ? ((cards[0] as Card).type as PendingKind) : kind;
    const pending: PendingAction = {
      id: `pending-${this.state.eventLog.length + 1}`,
      kind: pendingKind,
      sourcePlayerId: player.id,
      ...(target ? { targetPlayerId: target.id } : {}),
      ...(action.namedCardName ? { namedCardName: action.namedCardName } : {}),
      ...(discardCard ? { discardCardId: discardCard.id } : {}),
      playedCards: cards,
      awaiting: 'counter',
      counterQueue: this.counterQueueAfter(player.id),
      counterStack: [],
    };
    this.state.pending = pending;
    this.state.cardsPlayedThisTurn += 1;

    const targetSuffix = target ? `，目标 ${target.name}` : '';
    const nameSuffix =
      kind === 'comboThree' && action.namedCardName
        ? `，指定「${CARD_NAME_OPTIONS.find((o) => o.key === action.namedCardName)?.label ?? ''}」`
        : '';
    if (kind === 'single') {
      this.logEvent('play', `${player.name} 打出「${cardDisplayName(cards[0] as Card)}」${targetSuffix}`);
    } else {
      this.logEvent('play', `${player.name} 打出 ${pendingLabel(pending).replace(/[「」组合]/g, '')} 组合${targetSuffix}${nameSuffix}`);
    }

    if (pending.counterQueue.length === 0) {
      this.resolvePending();
    }
    return { ok: true };
  }

  private counterQueueAfter(excludeId: string): string[] {
    const alive = this.alivePlayers();
    const index = alive.findIndex((p) => p.id === excludeId);
    const ordered = index >= 0 ? [...alive.slice(index + 1), ...alive.slice(0, index)] : alive;
    return ordered.filter((p) => p.hand.some((c) => c.type === 'nope')).map((p) => p.id);
  }

  private resolvePending(): void {
    const state = this.state;
    const pending = state.pending;
    if (!pending) return;
    if (pending.awaiting !== 'counter') return;
    const source = this.player(pending.sourcePlayerId);
    const sourceName = source?.name ?? '玩家';

    if (pending.counterStack.length % 2 === 1) {
      this.logEvent('counter', `${sourceName} 的${pendingLabel(pending)}被休想取消`);
      state.pending = null;
      return;
    }

    switch (pending.kind) {
      case 'attack': {
        this.logEvent('effect', `${sourceName} 的攻击生效，下一位玩家需进行两个回合`);
        this.transferAttack();
        return;
      }
      case 'skip': {
        this.logEvent('effect', `${sourceName} 使用跳过，直接结束本回合`);
        state.pending = null;
        this.advanceTurn();
        return;
      }
      case 'shuffle': {
        shuffleInPlace(state.drawPile, state);
        this.logEvent('effect', `${sourceName} 使用洗混，抽牌堆已重新洗乱`);
        state.pending = null;
        return;
      }
      case 'seeFuture': {
        pending.seenCards = state.drawPile.slice(0, 3);
        pending.awaiting = 'seeFutureAck';
        this.logEvent('effect', `${sourceName} 使用了预见未来，查看抽牌堆顶部三张牌`);
        return;
      }
      case 'favor': {
        const target = this.player(pending.targetPlayerId ?? '');
        if (!target || target.hand.length === 0) {
          this.logEvent('effect', `${sourceName} 对 ${target?.name ?? '目标玩家'} 使用恩惠，但目标没有手牌，未获得卡牌`);
          state.pending = null;
          return;
        }
        pending.awaiting = 'favorGive';
        this.logEvent('effect', `${sourceName} 对 ${target.name} 使用恩惠，等待其交出一张手牌`);
        return;
      }
      case 'comboTwo': {
        const target = this.player(pending.targetPlayerId ?? '');
        if (!target) {
          state.pending = null;
          return;
        }
        if (target.hand.length === 0) {
          this.logEvent('effect', `${sourceName} 的两张相同猫咪组合执行，但 ${target.name} 没有手牌`);
          state.pending = null;
          return;
        }
        const index = randomInt(state, target.hand.length);
        const card = target.hand[index];
        if (card) {
          target.hand.splice(index, 1);
          source?.hand.push(card);
          this.logEvent('effect', `${sourceName} 从 ${target.name} 手牌中随机获得一张牌`);
        }
        state.pending = null;
        return;
      }
      case 'comboThree': {
        const target = this.player(pending.targetPlayerId ?? '');
        const namedKey = pending.namedCardName;
        const matchIndex = target && namedKey
          ? target.hand.findIndex((c) => cardNameKey(c) === namedKey)
          : -1;
        if (target && matchIndex >= 0) {
          const card = target.hand[matchIndex];
          if (card) {
            target.hand.splice(matchIndex, 1);
            source?.hand.push(card);
            this.logEvent('effect', `${sourceName} 向 ${target.name} 索取「${cardDisplayName(card)}」，获得一张`);
          }
        } else {
          const ids = new Set(pending.playedCards.map((c) => c.id));
          state.discardPile = state.discardPile.filter((c) => !ids.has(c.id));
          if (source) source.hand.push(...pending.playedCards);
          this.logEvent('effect', `${sourceName} 的三张相同猫咪组合失败，三张猫咪退回手牌`);
        }
        state.pending = null;
        return;
      }
      case 'comboFive': {
        const card = state.discardPile.find((c) => c.id === pending.discardCardId);
        if (card) {
          state.discardPile = state.discardPile.filter((c) => c.id !== card.id);
          source?.hand.push(card);
          this.logEvent('effect', `${sourceName} 从弃牌堆获得「${cardDisplayName(card)}」`);
        }
        state.pending = null;
        return;
      }
      default:
        state.pending = null;
        return;
    }
  }

  private respondCounter(action: Extract<GameAction, { type: 'RESPOND_COUNTER' }>): ActionResult {
    const pending = this.state.pending;
    if (!pending || pending.awaiting !== 'counter') return this.fail('当前没有可反制的卡牌效果');
    if (pending.counterQueue[0] !== action.playerId) return this.fail('尚未轮到该玩家响应');
    const player = this.player(action.playerId);
    if (!player || !player.alive) return this.fail('玩家已淘汰');
    if (!action.useNope) {
      pending.counterQueue.shift();
      if (pending.counterQueue.length === 0) this.resolvePending();
      return { ok: true };
    }
    const nope = player.hand.find((c) => c.type === 'nope');
    if (!nope) return this.fail('没有休想卡牌');
    player.hand = player.hand.filter((c) => c.id !== nope.id);
    this.state.discardPile.push(nope);
    pending.counterStack.push({ playerId: player.id, cardId: nope.id });
    this.logEvent('counter', `${player.name} 使用休想反制（反制层数 ${pending.counterStack.length}）`);
    pending.counterQueue = this.counterQueueAfter(player.id);
    if (pending.counterQueue.length === 0) this.resolvePending();
    return { ok: true };
  }

  private drawCard(action: Extract<GameAction, { type: 'DRAW_CARD' }>): ActionResult {
    if (this.state.phase !== 'playing') return this.fail('对局未在进行中');
    if (this.state.pending) return this.fail('请先处理当前待处理的效果');
    if (this.state.currentPlayerId !== action.playerId) return this.fail('不是当前玩家的回合');
    const player = this.player(action.playerId);
    if (!player || !player.alive) return this.fail('玩家已淘汰');
    const card = this.state.drawPile.shift();
    if (!card) return this.fail('抽牌堆已空，无法抽牌');
    if (card.type !== 'bomb') {
      player.hand.push(card);
      this.logEvent('draw', `${player.name} 抽了一张牌`);
      this.advanceTurn();
      return { ok: true };
    }
    this.logEvent('bomb', `${player.name} 抽到了炸弹猫`);
    const hasDefuse = player.hand.some((c) => c.type === 'defuse');
    this.state.pending = {
      id: `pending-${this.state.eventLog.length + 1}`,
      kind: 'bomb',
      sourcePlayerId: player.id,
      playedCards: [],
      drawnBomb: card,
      awaiting: 'bombDecision',
      counterQueue: [],
      counterStack: [],
    };
    if (!hasDefuse) {
      this.eliminateByBomb();
    }
    return { ok: true };
  }

  private resolveBomb(action: Extract<GameAction, { type: 'RESOLVE_BOMB' }>): ActionResult {
    const pending = this.state.pending;
    if (!pending || pending.kind !== 'bomb' || pending.awaiting !== 'bombDecision') {
      return this.fail('当前没有待处理的炸弹猫');
    }
    if (pending.sourcePlayerId !== action.playerId) return this.fail('只能由抽到炸弹猫的玩家处理');
    const player = this.player(action.playerId);
    if (!player) return this.fail('玩家不存在');
    if (!action.useDefuse) {
      this.eliminateByBomb();
      return { ok: true };
    }
    const defuse = player.hand.find((c) => c.type === 'defuse');
    if (!defuse) return this.fail('没有拆除卡牌');
    player.hand = player.hand.filter((c) => c.id !== defuse.id);
    this.state.discardPile.push(defuse);
    pending.awaiting = 'bombInsert';
    this.logEvent('bomb', `${player.name} 打出拆除（消火），需要秘密放回炸弹猫`);
    return { ok: true };
  }

  private eliminateByBomb(): void {
    const pending = this.state.pending;
    if (!pending || pending.kind !== 'bomb' || !pending.drawnBomb) return;
    const player = this.player(pending.sourcePlayerId);
    if (!player) return;
    this.state.removedPile.push(pending.drawnBomb, ...player.hand);
    player.hand = [];
    player.alive = false;
    this.state.pending = null;
    this.logEvent('elimination', `${player.name} 没有拆除卡，被炸弹猫淘汰，全部卡牌移出本局`);
    const alive = this.alivePlayers();
    if (alive.length <= 1) {
      this.finishGame(alive[0]?.id ?? null);
      return;
    }
    const next = this.nextAliveFrom(player.seat);
    if (next) this.state.currentPlayerId = next.id;
    // 规则确认 Q-01：攻击状态随被攻击者淘汰失效，后续玩家按正常 1 个回合开始。
    this.state.turnsRemaining = 1;
    this.state.turnNumber += 1;
    this.state.cardsPlayedThisTurn = 0;
  }

  private finishGame(winnerId: string | null): void {
    this.state.phase = 'finished';
    this.state.winnerPlayerId = winnerId;
    const winner = winnerId ? this.player(winnerId) : undefined;
    if (winner) this.logEvent('finish', `${winner.name} 成为最后存活玩家，赢得对局`);
    else this.logEvent('finish', '对局结束');
  }

  private chooseBombInsert(action: Extract<GameAction, { type: 'CHOOSE_BOMB_INSERT' }>): ActionResult {
    const pending = this.state.pending;
    if (!pending || pending.kind !== 'bomb' || pending.awaiting !== 'bombInsert') {
      return this.fail('当前不需要放回炸弹猫');
    }
    if (pending.sourcePlayerId !== action.playerId) return this.fail('只能由抽到炸弹猫的玩家放回');
    const bomb = pending.drawnBomb;
    if (!bomb) return this.fail('炸弹猫状态异常');
    if (!Number.isInteger(action.index) || action.index < 0 || action.index > this.state.drawPile.length) {
      return this.fail('放回位置无效');
    }
    this.state.drawPile.splice(action.index, 0, bomb);
    this.state.pending = null;
    this.logEvent('bomb', '炸弹猫已秘密放回抽牌堆');
    this.advanceTurn();
    return { ok: true };
  }

  private chooseFavorCard(action: Extract<GameAction, { type: 'CHOOSE_FAVOR_CARD' }>): ActionResult {
    const pending = this.state.pending;
    if (!pending || pending.kind !== 'favor' || pending.awaiting !== 'favorGive') {
      return this.fail('当前没有待交付的恩惠效果');
    }
    if (pending.targetPlayerId !== action.playerId) return this.fail('只能由被指定玩家交出卡牌');
    const player = this.player(action.playerId);
    if (!player) return this.fail('玩家不存在');
    const card = player.hand.find((c) => c.id === action.cardId);
    if (!card) return this.fail('选择的卡牌不在手牌中');
    const source = this.player(pending.sourcePlayerId);
    player.hand = player.hand.filter((c) => c.id !== card.id);
    source?.hand.push(card);
    this.state.pending = null;
    this.logEvent('effect', `${player.name} 向 ${source?.name ?? '出牌者'} 交出一张手牌`);
    return { ok: true };
  }

  private ackSeeFuture(action: Extract<GameAction, { type: 'ACK_SEE_FUTURE' }>): ActionResult {
    const pending = this.state.pending;
    if (!pending || pending.kind !== 'seeFuture' || pending.awaiting !== 'seeFutureAck') {
      return this.fail('当前没有待确认的预见未来');
    }
    if (pending.sourcePlayerId !== action.playerId) return this.fail('只能由使用者确认');
    this.state.pending = null;
    this.logEvent('effect', '预见未来查看完成，三张牌按原顺序放回抽牌堆顶部');
    return { ok: true };
  }

  private transferAttack(): void {
    const current = this.state.currentPlayerId ? this.player(this.state.currentPlayerId) : undefined;
    if (!current) return;
    const next = this.nextAliveFrom(current.seat);
    if (!next) return;
    this.state.pending = null;
    this.state.currentPlayerId = next.id;
    this.state.turnsRemaining = 2;
    this.state.cardsPlayedThisTurn = 0;
    this.state.turnNumber += 1;
  }

  private advanceTurn(): void {
    const current = this.state.currentPlayerId ? this.player(this.state.currentPlayerId) : undefined;
    if (!current) return;
    this.state.cardsPlayedThisTurn = 0;
    this.state.turnsRemaining -= 1;
    if (this.state.turnsRemaining > 0) {
      this.state.turnNumber += 1;
      return;
    }
    this.state.turnsRemaining = 1;
    const next = this.nextAliveFrom(current.seat);
    if (next) this.state.currentPlayerId = next.id;
    this.state.turnNumber += 1;
  }

  canStart(): boolean {
    return this.startBlockReason() === null;
  }

  blockReason(): string | null {
    return this.startBlockReason();
  }

  forkForTest(): GameEngine {
    return this.fork();
  }
}

export { pendingLabel };
