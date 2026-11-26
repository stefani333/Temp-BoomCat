import type {
  DemoOutcome,
  HandCard,
  PlayerCount,
  ResultData,
  Seat,
  Setup,
  TableState,
} from './types';

export const ME = 'p1';

export const PLAYER_NAMES = ['我', '模拟玩家 A', '模拟玩家 B', '模拟玩家 C', '模拟玩家 D'];

export const DEFAULT_SETUP: Setup = {
  target: 4,
  seed: '',
  nickname: '我',
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
    fullName: '预见未来（幻觉）',
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

/** 房间等待页初始座位：房主未准备，先加入的模拟玩家已自动准备，其余为空位 */
export function makeSeats(target: number): Seat[] {
  const seats: Seat[] = [
    { id: 'p1', name: '我', kind: 'me', host: true, ready: false, alive: true, handCount: 0 },
  ];
  const botCount = Math.min(2, target - 1);
  for (let index = 0; index < botCount; index += 1) {
    seats.push({
      id: `p${seats.length + 1}`,
      name: PLAYER_NAMES[seats.length] ?? `模拟玩家 ${seats.length}`,
      kind: 'bot',
      ready: true,
      alive: true,
      handCount: 0,
    });
  }
  while (seats.length < target) {
    seats.push({ id: '', name: '空位', kind: 'bot', ready: false, alive: true, handCount: 0 });
  }
  return seats;
}

/** 牌桌默认演示数据，贴近线上对局快照，同时保留可点击状态 */
export function makeDemoTable(): TableState {
  return {
    roomId: 'LOCAL-0001',
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
      '第 3 回合开始，当前玩家：我',
      '模拟玩家 A 打出恩惠（调情），指定模拟玩家 B',
      '模拟玩家 B 交出一张手牌',
      '我打出两张汉堡猫咪，随机获得模拟玩家 A 一张手牌',
      '模拟玩家 C 使用预见未来（幻觉），查看牌堆顶部三张',
      '模拟玩家 C 抽到炸弹猫，未持有拆除',
      '模拟玩家 C 被淘汰，全部手牌移出本局',
      '模拟玩家 B 打出攻击（高潮），下一位玩家需进行两个回合',
      '模拟玩家 A 未使用休想，攻击生效',
      '模拟玩家 A 抽牌，回合结束',
      '模拟玩家 B 抽牌，回合结束',
      '轮到我了：可以出牌或抽牌结束本回合',
    ],
  };
}

export function makeTableFromSeats(seats: Seat[]): TableState {
  const joined = seats
    .filter((seat) => Boolean(seat.id))
    .map((seat) => ({
      ...seat,
      ready: true,
      alive: true,
      handCount: seat.kind === 'me' ? INITIAL_HAND.length : 4,
    }));
  const starter = joined.find((seat) => seat.id === ME);
  return {
    roomId: 'LOCAL-0001',
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
  roomId: 'LOCAL-0001',
  turnNumber: 9,
  winner: '模拟玩家 B',
  survivors: 1,
  participants: 4,
  players: [
    { id: 'p1', name: '我', isBot: false, alive: false, winner: false },
    { id: 'p2', name: '模拟玩家 A', isBot: true, alive: false, winner: false },
    { id: 'p3', name: '模拟玩家 B', isBot: true, alive: true, winner: true },
    { id: 'p4', name: '模拟玩家 C', isBot: true, alive: false, winner: false },
  ],
  keyEvents: [
    '模拟玩家 C 抽到炸弹猫，未持有拆除',
    '模拟玩家 C 被淘汰',
    '模拟玩家 B 成为最后存活玩家',
  ],
  log: [
    '房间锁定，对局开始',
    '起始玩家：我',
    '我打出跳过（逃脱），回合结束',
    '模拟玩家 A 抽牌，回合结束',
    '模拟玩家 B 打出两张汉堡猫咪，获得模拟玩家 A 一张手牌',
    '模拟玩家 C 使用预见未来（幻觉），查看牌堆顶部三张',
    '我打出恩惠（调情），模拟玩家 A 交出一张手牌',
    '模拟玩家 C 抽到炸弹猫，未持有拆除',
    '模拟玩家 C 被淘汰，全部手牌移出本局',
    '模拟玩家 A 抽到炸弹猫，使用拆除并秘密放回牌堆',
    '模拟玩家 B 抽牌，回合结束',
    '模拟玩家 B 成为最后存活玩家',
  ],
};

export const DEFAULT_DEMO: DemoOutcome = {
  finished: true,
  winner: '模拟玩家 B',
  steps: 87,
  participants: 4,
  survivors: 1,
  log: [
    '房间锁定，对局开始',
    '起始玩家：模拟玩家 A',
    '模拟玩家 A 抽牌，回合结束',
    '模拟玩家 B 打出恩惠（调情），指定模拟玩家 C',
    '模拟玩家 C 交出一张手牌',
    '我打出跳过（逃脱），回合结束',
    '模拟玩家 C 抽到炸弹猫，使用拆除并秘密放回牌堆',
    '模拟玩家 A 打出攻击（高潮）',
    '模拟玩家 B 未使用休想，攻击生效',
    '我抽到炸弹猫，未持有拆除',
    '我被淘汰，全部手牌移出本局',
    '模拟玩家 B 成为最后存活玩家',
  ],
};

export function displayName(card: HandCard): string {
  return card.fullName ?? card.name;
}
