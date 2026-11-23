import type {
  HandCard,
  PlayerCount,
  ResultData,
  Seat,
  Setup,
  TableState,
} from './types';

export const ME = 'p1';

export const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4', 'p5'];

export const PLAYER_NAMES = ['我', '模拟玩家 A', '模拟玩家 B', '模拟玩家 C', '模拟玩家 D'];

export const DEFAULT_SETUP: Setup = {
  target: 4,
  starterId: '',
  seed: '',
};

export const INITIAL_HAND: HandCard[] = [
  {
    id: 'c-skip',
    name: '跳过',
    fullName: '跳过（逃脱）',
    kind: 'action',
    effect: '结束当前回合且不抽牌',
  },
  {
    id: 'c-foresee',
    name: '预见未来',
    kind: 'action',
    effect: '查看抽牌堆顶部三张，按原顺序放回',
  },
  {
    id: 'c-defuse',
    name: '拆除',
    fullName: '拆除（消火）',
    kind: 'defuse',
    effect: '抵消一次炸弹猫，并将炸弹放回牌堆',
  },
  {
    id: 'c-favor',
    name: '恩惠',
    fullName: '恩惠（调情）',
    kind: 'action',
    effect: '指定一名其他玩家，由其选择一张手牌交给你',
  },
  {
    id: 'c-burger-1',
    name: '汉堡猫咪',
    kind: 'cat',
    effect: '两张相同：随机获得目标一张手牌',
  },
  {
    id: 'c-burger-2',
    name: '汉堡猫咪',
    kind: 'cat',
    effect: '两张相同：随机获得目标一张手牌',
  },
  {
    id: 'c-burger-3',
    name: '汉堡猫咪',
    kind: 'cat',
    effect: '三张相同：指定卡牌名称',
  },
];

/** 房间等待页的初始座位：我、模拟玩家 A 已准备，模拟玩家 B 未准备，其余为空位 */
export function makeSeats(target: number): Seat[] {
  const seats: Seat[] = [
    { id: 'p1', name: '我', kind: 'me', host: true, ready: true, alive: true, handCount: 0 },
    { id: 'p2', name: '模拟玩家 A', kind: 'bot', ready: true, alive: true, handCount: 0 },
  ];
  if (target >= 3) {
    seats.push({ id: 'p3', name: '模拟玩家 B', kind: 'bot', ready: false, alive: true, handCount: 0 });
  }
  while (seats.length < target) {
    seats.push({ id: '', name: '空位', kind: 'bot', ready: false, alive: true, handCount: 0 });
  }
  return seats;
}

/** 空态演示用：座位已满且全员已准备，但起始玩家未指定 */
export function makeFullReadySeats(target: PlayerCount): Seat[] {
  return Array.from({ length: target }, (_, index) => ({
    id: PLAYER_IDS[index]!,
    name: PLAYER_NAMES[index]!,
    kind: index === 0 ? ('me' as const) : ('bot' as const),
    host: index === 0,
    ready: true,
    alive: true,
    handCount: 0,
  }));
}

/** 牌桌默认演示数据，贴近线框稿中的对局快照，同时保留可点击状态 */
export function makeDemoTable(): TableState {
  return {
    round: 3,
    currentId: ME,
    drawPile: 27,
    discardCount: 12,
    discardTop: '攻击（高潮）',
    remainingTurns: 1,
    seats: [
      { id: 'p1', name: '我', kind: 'me', host: true, ready: true, alive: true, handCount: INITIAL_HAND.length },
      { id: 'p2', name: '模拟玩家 A', kind: 'bot', ready: true, alive: true, handCount: 4 },
      { id: 'p3', name: '模拟玩家 B', kind: 'bot', ready: true, alive: true, handCount: 3 },
      { id: 'p4', name: '模拟玩家 C', kind: 'bot', ready: true, alive: false, handCount: 0 },
    ],
    hand: INITIAL_HAND.map((card) => ({ ...card })),
    log: [
      '第 3 轮开始',
      '模拟玩家 A 打出恩惠，指定模拟玩家 B',
      '模拟玩家 B 交出一张手牌',
      '模拟玩家 C 抽到炸弹猫，未持有拆除',
      '模拟玩家 C 被淘汰',
    ],
  };
}

export function makeTableFromSeats(seats: Seat[], starterId: string): TableState {
  const joined = seats
    .filter((seat) => Boolean(seat.id))
    .map((seat) => ({
      ...seat,
      ready: true,
      alive: true,
      handCount: seat.kind === 'me' ? INITIAL_HAND.length : 4,
    }));
  const starter = joined.find((seat) => seat.id === starterId);
  return {
    round: 1,
    currentId: starter?.id ?? ME,
    drawPile: 27,
    discardCount: 12,
    discardTop: '攻击（高潮）',
    remainingTurns: 1,
    seats: joined,
    hand: INITIAL_HAND.map((card) => ({ ...card })),
    log: [
      '房间锁定，对局开始',
      `起始玩家：${starter?.name ?? '我'}`,
    ],
  };
}

export const DEFAULT_RESULT: ResultData = {
  winner: '模拟玩家 B',
  rounds: 9,
  survivors: 1,
  keyEvents: [
    '模拟玩家 C 抽到炸弹猫，无拆除',
    '模拟玩家 C 被淘汰',
    '模拟玩家 B 成为最后存活玩家',
  ],
  log: [
    '第 1 轮开始，起始玩家：我',
    '我打出跳过，回合结束',
    '模拟玩家 A 抽牌，回合结束',
    '模拟玩家 B 打出两张汉堡猫咪，获得模拟玩家 A 一张手牌',
    '模拟玩家 C 使用预见未来，查看牌堆顶部三张',
    '我打出恩惠，模拟玩家 A 交出一张手牌',
    '模拟玩家 C 抽到炸弹猫，未持有拆除',
    '模拟玩家 C 被淘汰',
    '模拟玩家 A 抽到炸弹猫，使用拆除并放回牌堆顶部',
    '模拟玩家 B 抽牌，回合结束',
    '第 9 轮，模拟玩家 B 成为最后存活玩家',
  ],
};

export function displayName(card: HandCard): string {
  return card.fullName ?? card.name;
}
