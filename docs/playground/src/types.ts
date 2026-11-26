export type PlayerCount = 2 | 3 | 4 | 5;

export type DeviceKind = 'phone' | 'desktop';

export type ScreenId = 'home' | 'lobby' | 'table' | 'result' | 'edge';

export type CardKind = 'action' | 'cat' | 'defuse' | 'bomb' | 'nope';

export type OverlayKind =
  | 'play'
  | 'combo'
  | 'comboError'
  | 'counter'
  | 'target'
  | 'guess'
  | 'discard'
  | 'foresee'
  | 'bomb'
  | 'bombPlace'
  | 'log'
  | 'discardPile'
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
}

export interface TableState {
  round: number;
  currentId: string;
  drawPile: number;
  discardCount: number;
  discardTop: string;
  remainingTurns: number;
  seats: Seat[];
  hand: HandCard[];
  log: string[];
}

export interface ResultData {
  winner: string;
  rounds: number;
  survivors: number;
  keyEvents: string[];
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
}
