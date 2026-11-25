import type { GameState } from '@bombcat/game-core';

export interface SnapshotConfig {
  count: 2 | 3 | 4 | 5;
  name: string;
  seed?: number;
  startSeat: number;
}

export interface GameSnapshot {
  version: 1;
  savedAt: string;
  config: SnapshotConfig;
  state: GameState;
}

const STORAGE_KEY = 'bombcat:game-snapshot:v1';

function isValidConfig(value: unknown): value is SnapshotConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<SnapshotConfig>;
  return (
    typeof config.count === 'number'
    && Number.isInteger(config.count)
    && config.count >= 2
    && config.count <= 5
    && typeof config.name === 'string'
    && typeof config.startSeat === 'number'
    && Number.isInteger(config.startSeat)
    && config.startSeat >= 1
    && config.startSeat <= config.count
    && (config.seed === undefined || typeof config.seed === 'number')
  );
}

function isValidState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return (
    (state.phase === 'lobby' || state.phase === 'playing' || state.phase === 'finished')
    && Array.isArray(state.players)
    && state.players.length > 0
    && Array.isArray(state.drawPile)
    && Array.isArray(state.discardPile)
    && Array.isArray(state.removedPile)
    && Array.isArray(state.eventLog)
    && typeof state.rngState === 'number'
    && typeof state.targetPlayerCount === 'number'
  );
}

function removeSnapshot(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 本地存储不可用时忽略
  }
}

export function loadSnapshot(): GameSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameSnapshot>;
    if (parsed.version !== 1 || !isValidConfig(parsed.config) || !isValidState(parsed.state)) {
      removeSnapshot();
      return null;
    }
    const state = parsed.state;
    state.processedActionIds = Array.isArray(state.processedActionIds) ? state.processedActionIds : [];
    state.stepCount = typeof state.stepCount === 'number' ? state.stepCount : 0;
    return {
      version: 1,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
      config: parsed.config,
      state,
    };
  } catch {
    removeSnapshot();
    return null;
  }
}

export function saveSnapshot(snapshot: GameSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // 存储空间不足或隐私模式禁用时忽略，不影响当前对局
  }
}
