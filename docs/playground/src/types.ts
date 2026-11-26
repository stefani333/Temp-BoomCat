export type PlayerCount = 2 | 3 | 4 | 5;

export type DeviceKind = 'phone' | 'desktop';

export type ScreenId = 'home' | 'lobby' | 'table' | 'result' | 'demo' | 'edge';

export type CardKind = 'action' | 'cat' | 'defuse' | 'bomb' | 'nope';

export type OverlayKind =
  | 'target'
  | 'guess'
  | 'discard'
  | 'counter'
  | 'favorGive'
  | 'foresee'
  | 'bomb'
  | 'bombPlace'
  | 'eliminated'
  | 'discardPile'
  | 'play'
  | 'combo'
  | 'comboError'
  | 'log'
  | null;

export interface HandCard {
  id: string;
  name: string;
  fullName?: string;
  kind: CardKind;
  effect: string;
}

export interface Seat {
  id: string;
  name: string;
  kind: 'me' | 'bot';
  host?: boolean;
  ready: boolean;
  alive: boolean;
  handCount: number;
}

export interface Setup {
  target: PlayerCount;
  seed: string;
  nickname: string;
}

export interface TableState {
  roomId: string;
  round: number;
  currentId: string;
  drawPile: number;
  discardCount: number;
  discardTop: string;
  remainingTurns: number;
  seats: Seat[];
  hand: HandCard[];
  log: string[];
  pendingLabel?: string;
  pendingStatus?: string;
  counterDepth?: number;
}

export interface ResultPlayer {
  id: string;
  name: string;
  isBot: boolean;
  alive: boolean;
  winner: boolean;
}

export interface ResultData {
  roomId: string;
  turnNumber: number;
  winner: string;
  survivors: number;
  participants: number;
  players: ResultPlayer[];
  keyEvents: string[];
  log: string[];
}

export interface DemoOutcome {
  finished: boolean;
  winner: string;
  steps: number;
  participants: number;
  survivors: number;
  log: string[];
}

export interface PageMeta {
  id: string;
  no: number;
  title: string;
  group: string;
  summary: string;
  screen: ScreenId;
  device?: DeviceKind;
  overlay?: Exclude<OverlayKind, null>;
  initialSelection?: string[];
  legacy?: boolean;
}
