export type CardType =
  | 'bomb'
  | 'defuse'
  | 'nope'
  | 'favor'
  | 'attack'
  | 'skip'
  | 'shuffle'
  | 'seeFuture'
  | 'cat';

export type CatName = 'iceCream' | 'fries' | 'burger' | 'burrito' | 'friedChicken';

export interface Card {
  id: string;
  type: CardType;
  cat?: CatName;
}

export interface Player {
  id: string;
  seat: number;
  name: string;
  isBot: boolean;
  isHost: boolean;
  ready: boolean;
  alive: boolean;
  hand: Card[];
}

export type Phase = 'lobby' | 'playing' | 'finished';

export type PendingKind =
  | 'favor'
  | 'attack'
  | 'skip'
  | 'shuffle'
  | 'seeFuture'
  | 'comboTwo'
  | 'comboThree'
  | 'comboFive'
  | 'bomb';

export type Awaiting =
  | 'counter'
  | 'favorGive'
  | 'seeFutureAck'
  | 'bombDecision'
  | 'bombInsert';

export interface PendingAction {
  id: string;
  kind: PendingKind;
  sourcePlayerId: string;
  targetPlayerId?: string;
  namedCardName?: string;
  discardCardId?: string;
  playedCards: Card[];
  drawnBomb?: Card;
  seenCards?: Card[];
  awaiting: Awaiting;
  counterQueue: string[];
  counterStack: Array<{ playerId: string; cardId: string }>;
}

export interface GameEvent {
  seq: number;
  kind: string;
  message: string;
  privateTo?: string;
}

export interface GameState {
  gameId: string;
  roomId: string;
  phase: Phase;
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  removedPile: Card[];
  currentPlayerId: string | null;
  turnsRemaining: number;
  turnNumber: number;
  cardsPlayedThisTurn: number;
  pending: PendingAction | null;
  winnerPlayerId: string | null;
  hostId: string | null;
  targetPlayerCount: number;
  startPlayerId: string | null;
  eventLog: GameEvent[];
  rngState: number;
  stepCount: number;
  processedActionIds: string[];
}

export type GameAction =
  | { type: 'JOIN_ROOM'; name: string; isBot: boolean; playerId?: string }
  | { type: 'SET_READY'; playerId: string; ready: boolean }
  | { type: 'SET_START_PLAYER'; playerId: string; startPlayerId: string }
  | { type: 'START_GAME'; playerId: string }
  | {
      type: 'PLAY_CARD';
      playerId: string;
      cardIds: string[];
      targetPlayerId?: string;
      namedCardName?: string;
      discardCardId?: string;
    }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'RESPOND_COUNTER'; playerId: string; useNope: boolean }
  | { type: 'CHOOSE_FAVOR_CARD'; playerId: string; cardId: string }
  | { type: 'RESOLVE_BOMB'; playerId: string; useDefuse: boolean }
  | { type: 'CHOOSE_BOMB_INSERT'; playerId: string; index: number }
  | { type: 'ACK_SEE_FUTURE'; playerId: string };

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export const CARD_LABELS: Record<CardType, string> = {
  bomb: '炸弹猫',
  defuse: '拆除（消火）',
  nope: '休想（狗扯）',
  favor: '恩惠（调情）',
  attack: '攻击（高潮）',
  skip: '跳过（逃脱）',
  shuffle: '洗混（搅乱）',
  seeFuture: '预见未来（幻觉）',
  cat: '特殊猫咪',
};

export const CAT_LABELS: Record<CatName, string> = {
  iceCream: '冰淇淋猫咪',
  fries: '薯条猫咪',
  burger: '汉堡猫咪',
  burrito: '卷饼猫咪',
  friedChicken: '炸鸡猫咪',
};

export const CAT_NAMES: CatName[] = ['iceCream', 'fries', 'burger', 'burrito', 'friedChicken'];

export const CARD_COUNTS: Record<CardType, number> = {
  bomb: 4,
  defuse: 6,
  nope: 5,
  favor: 4,
  attack: 4,
  skip: 4,
  shuffle: 4,
  seeFuture: 5,
  cat: 20,
};

export interface CardNameOption {
  key: string;
  label: string;
}

export function cardNameKey(card: Card): string {
  return card.type === 'cat' ? `cat:${card.cat}` : card.type;
}

export function cardDisplayName(card: Card): string {
  return card.type === 'cat' && card.cat ? CAT_LABELS[card.cat] : CARD_LABELS[card.type];
}

export const CARD_NAME_OPTIONS: CardNameOption[] = [
  { key: 'bomb', label: CARD_LABELS.bomb },
  { key: 'defuse', label: CARD_LABELS.defuse },
  { key: 'nope', label: CARD_LABELS.nope },
  { key: 'favor', label: CARD_LABELS.favor },
  { key: 'attack', label: CARD_LABELS.attack },
  { key: 'skip', label: CARD_LABELS.skip },
  { key: 'shuffle', label: CARD_LABELS.shuffle },
  { key: 'seeFuture', label: CARD_LABELS.seeFuture },
  ...CAT_NAMES.map((cat) => ({ key: `cat:${cat}`, label: CAT_LABELS[cat] })),
];

export function cardNameLabel(key: string): string {
  return CARD_NAME_OPTIONS.find((option) => option.key === key)?.label ?? key;
}

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  (Object.keys(CARD_COUNTS) as CardType[]).forEach((type) => {
    if (type === 'cat') {
      CAT_NAMES.forEach((cat) => {
        for (let i = 1; i <= 4; i += 1) {
          cards.push({ id: `cat-${cat}-${i}`, type: 'cat', cat });
        }
      });
    } else {
      for (let i = 1; i <= CARD_COUNTS[type]; i += 1) {
        cards.push({ id: `${type}-${i}`, type });
      }
    }
  });
  return cards;
}
