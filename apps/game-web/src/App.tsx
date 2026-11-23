import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameEngine,
  getGameView,
  nextBotStep,
  type GameAction,
  type GameView,
} from '@bombcat/game-core';
import { HomeScreen } from './screens/HomeScreen';
import { RoomScreen } from './screens/RoomScreen';
import { TableScreen, type PlayExtras } from './screens/TableScreen';
import { ResultScreen } from './screens/ResultScreen';
import { DemoScreen } from './screens/DemoScreen';

type Screen = 'home' | 'room' | 'table' | 'result' | 'demo';
type PlayerCount = 2 | 3 | 4 | 5;

interface RoomConfig {
  count: PlayerCount;
  name: string;
  seed?: number;
}

const ME = 'p1';

export function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const configRef = useRef<RoomConfig>({ count: 4, name: '我' });
  const [screen, setScreen] = useState<Screen>('home');
  const [view, setView] = useState<GameView | null>(null);
  const [toast, setToast] = useState('');
  const [stuck, setStuck] = useState(false);

  const refresh = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setView(getGameView(engine, ME));
  }, []);

  const apply = useCallback((action: GameAction): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    const result = engine.apply(action);
    if (!result.ok) {
      setToast(result.error ?? '操作失败');
      return false;
    }
    setToast('');
    refresh();
    return true;
  }, [refresh]);

  const createRoom = useCallback((count: PlayerCount, name: string, seed?: number) => {
    const engine = GameEngine.createRoom({
      targetPlayerCount: count,
      hostName: name,
      ...(seed !== undefined && Number.isFinite(seed) ? { seed } : {}),
    });
    engineRef.current = engine;
    configRef.current = { count, name, seed };
    setStuck(false);
    setView(getGameView(engine, ME));
    setScreen('room');
  }, []);

  useEffect(() => {
    setScreen((prev) => {
      if (!view) return prev;
      if (view.phase === 'playing') return 'table';
      if (view.phase === 'finished') return 'result';
      return prev;
    });
  }, [view?.phase]);

  useEffect(() => {
    if (!view || view.phase !== 'playing' || stuck || screen === 'demo') return;
    const engine = engineRef.current;
    if (!engine) return;
    const step = nextBotStep(engine.state);
    if (!step) return;
    const timer = setTimeout(() => {
      const result = engine.apply(step.action);
      if (!result.ok) {
        setToast(`模拟玩家操作失败：${result.error ?? '未知错误'}`);
        setStuck(true);
        return;
      }
      refresh();
    }, 620);
    return () => clearTimeout(timer);
  }, [view, stuck, screen, refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const backHome = () => {
    engineRef.current = null;
    setView(null);
    setScreen('home');
  };

  const restart = () => {
    const config = configRef.current;
    createRoom(config.count, config.name, config.seed);
  };

  return (
    <div className="app">
      {screen === 'home' ? (
        <HomeScreen onCreate={createRoom} onDemo={() => setScreen('demo')} />
      ) : null}

      {screen === 'demo' ? <DemoScreen onBack={backHome} /> : null}

      {screen === 'room' && view ? (
        <RoomScreen
          view={view}
          onJoinBot={() => apply({ type: 'JOIN_ROOM', isBot: true, name: '' })}
          onToggleReady={() => apply({ type: 'SET_READY', playerId: ME, ready: !view.myReady })}
          onSetStartPlayer={(playerId) => {
            if (!playerId) return;
            apply({ type: 'SET_START_PLAYER', playerId: ME, startPlayerId: playerId });
          }}
          onStart={() => apply({ type: 'START_GAME', playerId: ME })}
          onBack={backHome}
        />
      ) : null}

      {screen === 'table' && view ? (
        <TableScreen
          view={view}
          onPlay={(cardIds: string[], extras: PlayExtras) =>
            apply({ type: 'PLAY_CARD', playerId: ME, cardIds, ...extras })}
          onDraw={() => apply({ type: 'DRAW_CARD', playerId: ME })}
          onCounter={(useNope) => apply({ type: 'RESPOND_COUNTER', playerId: ME, useNope })}
          onFavorGive={(cardId) => apply({ type: 'CHOOSE_FAVOR_CARD', playerId: ME, cardId })}
          onResolveBomb={(useDefuse) => apply({ type: 'RESOLVE_BOMB', playerId: ME, useDefuse })}
          onInsertBomb={(index) => apply({ type: 'CHOOSE_BOMB_INSERT', playerId: ME, index })}
          onAckFuture={() => apply({ type: 'ACK_SEE_FUTURE', playerId: ME })}
        />
      ) : null}

      {screen === 'result' && view ? (
        <ResultScreen view={view} onRestart={restart} onHome={backHome} />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
