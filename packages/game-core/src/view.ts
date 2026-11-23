import { GameEngine } from './engine';
import {
  cardNameLabel,
  type Card,
  type PendingKind,
  type Awaiting,
  type GameState,
} from './types';

export interface PlayerView {
  id: string;
  seat: number;
  name: string;
  isBot: boolean;
  isHost: boolean;
  ready: boolean;
  alive: boolean;
  handCount: number;
  isCurrent: boolean;
}

export interface PendingView {
  id: string;
  kind: PendingKind;
  awaiting: Awaiting;
  sourcePlayerId: string;
  sourceName: string;
  targetPlayerId?: string;
  targetName?: string;
  namedCardName?: string;
  namedCardLabel?: string;
  seenCards?: Card[];
  drawnBomb?: Card;
  counterResponderId?: string;
  counterDepth: number;
  playedCardLabels: string[];
}

export interface EventView {
  seq: number;
  kind: string;
  message: string;
}

export interface GameView {
  gameId: string;
  roomId: string;
  phase: GameState['phase'];
  targetPlayerCount: number;
  hostId: string | null;
  startPlayerId: string | null;
  players: PlayerView[];
  myPlayerId: string;
  myHand: Card[];
  myReady: boolean;
  isHost: boolean;
  isMyTurn: boolean;
  canAct: boolean;
  currentPlayerId: string | null;
  currentPlayerName: string;
  turnsRemaining: number;
  turnNumber: number;
  drawPileCount: number;
  discardPile: Card[];
  pending: PendingView | null;
  winnerPlayerId: string | null;
  winnerName: string | null;
  events: EventView[];
  canStart: boolean;
  startBlockReason: string | null;
}

export function getGameView(engine: GameEngine, viewerId: string): GameView {
  const state = engine.state;
  const viewer = state.players.find((p) => p.id === viewerId);
  const pending = state.pending;
  const pendingView: PendingView | null = pending
    ? {
        id: pending.id,
        kind: pending.kind,
        awaiting: pending.awaiting,
        sourcePlayerId: pending.sourcePlayerId,
        sourceName: state.players.find((p) => p.id === pending.sourcePlayerId)?.name ?? '',
        ...(pending.targetPlayerId
          ? {
              targetPlayerId: pending.targetPlayerId,
              targetName: state.players.find((p) => p.id === pending.targetPlayerId)?.name ?? '',
            }
          : {}),
        ...(pending.namedCardName
          ? {
              namedCardName: pending.namedCardName,
              namedCardLabel: cardNameLabel(pending.namedCardName),
            }
          : {}),
        ...(pending.kind === 'seeFuture' && pending.sourcePlayerId === viewerId
          ? { seenCards: pending.seenCards ?? [] }
          : {}),
        ...(pending.drawnBomb ? { drawnBomb: pending.drawnBomb } : {}),
        ...(pending.awaiting === 'counter' && pending.counterQueue[0]
          ? { counterResponderId: pending.counterQueue[0] }
          : {}),
        counterDepth: pending.counterStack.length,
        playedCardLabels: pending.playedCards.map((c) =>
          c.type === 'cat' && c.cat ? cardNameLabel(`cat:${c.cat}`) : cardNameLabel(c.type),
        ),
      }
    : null;

  const winner = state.winnerPlayerId
    ? state.players.find((p) => p.id === state.winnerPlayerId)
    : undefined;

  return {
    gameId: state.gameId,
    roomId: state.roomId,
    phase: state.phase,
    targetPlayerCount: state.targetPlayerCount,
    hostId: state.hostId,
    startPlayerId: state.startPlayerId,
    players: state.players.map((p) => ({
      id: p.id,
      seat: p.seat,
      name: p.name,
      isBot: p.isBot,
      isHost: p.isHost,
      ready: p.ready,
      alive: p.alive,
      handCount: p.hand.length,
      isCurrent: p.id === state.currentPlayerId,
    })),
    myPlayerId: viewerId,
    myHand: viewer ? [...viewer.hand] : [],
    myReady: viewer?.ready ?? false,
    isHost: viewerId === state.hostId,
    isMyTurn: state.currentPlayerId === viewerId,
    canAct: state.phase === 'playing'
      && !state.pending
      && state.currentPlayerId === viewerId
      && !!viewer?.alive,
    currentPlayerId: state.currentPlayerId,
    currentPlayerName: state.players.find((p) => p.id === state.currentPlayerId)?.name ?? '',
    turnsRemaining: state.turnsRemaining,
    turnNumber: state.turnNumber,
    drawPileCount: state.drawPile.length,
    discardPile: [...state.discardPile],
    pending: pendingView,
    winnerPlayerId: state.winnerPlayerId,
    winnerName: winner?.name ?? null,
    events: state.eventLog
      .filter((event) => !event.privateTo || event.privateTo === viewerId)
      .map((event) => ({ seq: event.seq, kind: event.kind, message: event.message })),
    canStart: engine.canStart(),
    startBlockReason: engine.blockReason(),
  };
}

export function countCards(state: GameState): number {
  const inHands = state.players.reduce((sum, p) => sum + p.hand.length, 0);
  const pendingBomb = state.pending?.drawnBomb ? 1 : 0;
  return inHands + state.drawPile.length + state.discardPile.length + state.removedPile.length + pendingBomb;
}
