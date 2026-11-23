import { GameEngine } from './engine';
import { nextBotStep } from './bots';
import type { GameState } from './types';

export interface SimulationOptions {
  playerCount: 2 | 3 | 4 | 5;
  seed: number;
  maxSteps?: number;
}

export interface SimulationOutcome {
  state: GameState;
  steps: number;
  winnerId: string | null;
  winnerName: string | null;
  finished: boolean;
  error?: string;
}

export function runFullSimulation(options: SimulationOptions): SimulationOutcome {
  const engine = GameEngine.createRoom({
    targetPlayerCount: options.playerCount,
    seed: options.seed,
    hostName: '模拟玩家 A',
    hostIsBot: true,
  });
  const letters = 'ABCDE';
  for (let seat = 2; seat <= options.playerCount; seat += 1) {
    engine.apply({ type: 'JOIN_ROOM', isBot: true, name: `模拟玩家 ${letters[seat - 1]}` });
  }
  for (const player of engine.state.players) {
    engine.apply({ type: 'SET_READY', playerId: player.id, ready: true });
  }
  engine.apply({ type: 'SET_START_PLAYER', playerId: 'p1', startPlayerId: 'p1' });
  const started = engine.apply({ type: 'START_GAME', playerId: 'p1' });
  if (!started.ok) {
    return {
      state: engine.state,
      steps: 0,
      winnerId: null,
      winnerName: null,
      finished: false,
      error: started.error ?? '开局失败',
    };
  }

  const maxSteps = options.maxSteps ?? 20000;
  let steps = 0;
  while (engine.state.phase === 'playing' && steps < maxSteps) {
    const step = nextBotStep(engine.state);
    if (!step) {
      return {
        state: engine.state,
        steps,
        winnerId: null,
        winnerName: null,
        finished: false,
        error: '模拟停滞：没有可执行的自动操作',
      };
    }
    const result = engine.apply(step.action, `sim-${options.seed}-${steps}`);
    if (!result.ok) {
      return {
        state: engine.state,
        steps,
        winnerId: null,
        winnerName: null,
        finished: false,
        error: `第 ${steps + 1} 步失败：${result.error ?? '未知错误'}`,
      };
    }
    steps += 1;
  }

  const winner = engine.state.players.find((p) => p.id === engine.state.winnerPlayerId);
  return {
    state: engine.state,
    steps,
    winnerId: engine.state.winnerPlayerId,
    winnerName: winner?.name ?? null,
    finished: engine.state.phase === 'finished',
    ...(engine.state.phase === 'finished' ? {} : { error: '超过最大步数，对局未结束' }),
  };
}
