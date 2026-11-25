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
import {
  loadSnapshot,
  saveSnapshot,
  type GameSnapshot,
  type SnapshotConfig,
} from './storage';

type Screen = 'home' | 'room' | 'table' | 'result' | 'demo';
type PlayerCount = 2 | 3 | 4 | 5;
type RoomConfig = SnapshotConfig;

const ME = 'p1';

function newActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function screenFor(view: GameView): Screen {
  if (view.phase === 'playing') return 'table';
  if (view.phase === 'finished') return 'result';
  return 'room';
}

export function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const configRef = useRef<RoomConfig>({ count: 4, name: '我', startSeat: 1 });
  const [screen, setScreen] = useState<Screen>('home');
  const [view, setView] = useState<GameView | null>(null);
  const [toast, setToast] = useState('');
  const [stuck, setStuck] = useState(false);
  const [botError, setBotError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<GameSnapshot | null>(() => loadSnapshot());

  const refresh = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setView(getGameView(engine, ME));
  }, []);

  const apply = useCallback((action: GameAction): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    const result = engine.apply(action, newActionId());
    if (!result.ok) {
      setToast(result.error ?? '操作失败');
      return false;
    }
    setToast('');
    refresh();
    return true;
  }, [refresh]);

  const createRoom = useCallback(
    (count: PlayerCount, name: string, seed: number | undefined, startSeat: number) => {
      const seat = Math.min(Math.max(1, startSeat), count);
      const engine = GameEngine.createRoom({
        targetPlayerCount: count,
        hostName: name,
        ...(seed !== undefined && Number.isFinite(seed) ? { seed } : {}),
      });
      engineRef.current = engine;
      configRef.current = { count, name, seed, startSeat: seat };
      if (seat === 1) {
        engine.apply({ type: 'SET_START_PLAYER', playerId: ME, startPlayerId: ME }, newActionId());
      }
      setStuck(false);
      setBotError('');
      setView(getGameView(engine, ME));
      setScreen('room');
    },
    [],
  );

  useEffect(() => {
    setScreen((prev) => {
      if (!view) return prev;
      if (view.phase === 'playing') return 'table';
      if (view.phase === 'finished') return 'result';
      return prev;
    });
  }, [view?.phase]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !view) return;
    const snapshot: GameSnapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      config: configRef.current,
      state: engine.state,
    };
    saveSnapshot(snapshot);
    setSavedSnapshot(snapshot);
  }, [view]);

  useEffect(() => {
    if (!view || view.phase !== 'playing' || stuck || botError || screen === 'demo') return;
    const engine = engineRef.current;
    if (!engine) return;
    const step = nextBotStep(engine.state);
    if (!step) return;
    const timer = setTimeout(() => {
      const result = engine.apply(step.action, newActionId());
      if (!result.ok) {
        setBotError(`模拟玩家操作失败：${result.error ?? '未知错误'}`);
        setStuck(true);
        setToast('');
        return;
      }
      refresh();
    }, 620);
    return () => clearTimeout(timer);
  }, [view, stuck, botError, screen, refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const joinBot = useCallback(() => {
    if (!apply({ type: 'JOIN_ROOM', isBot: true, name: '' })) return;
    const engine = engineRef.current;
    if (!engine) return;
    const preferredSeat = configRef.current.startSeat;
    if (preferredSeat <= 1 || engine.state.startPlayerId) return;
    const target = engine.state.players.find((p) => p.seat === preferredSeat);
    if (target) {
      apply({ type: 'SET_START_PLAYER', playerId: ME, startPlayerId: target.id });
    }
  }, [apply]);

  const backHome = () => {
    engineRef.current = null;
    setView(null);
    setStuck(false);
    setBotError('');
    setScreen('home');
  };

  const continueSaved = useCallback(() => {
    if (!savedSnapshot) return;
    const engine = new GameEngine(savedSnapshot.state);
    engineRef.current = engine;
    configRef.current = savedSnapshot.config;
    const nextView = getGameView(engine, ME);
    setStuck(false);
    setBotError('');
    setToast('');
    setView(nextView);
    setScreen(screenFor(nextView));
  }, [savedSnapshot]);

  const restart = () => {
    const config = configRef.current;
    const engine = engineRef.current;
    const startSeat = engine?.state.startPlayerId
      ? engine.state.players.find((p) => p.id === engine.state.startPlayerId)?.seat ?? config.startSeat
      : config.startSeat;
    createRoom(config.count, config.name, config.seed, startSeat);
  };

  const returnToRoom = useCallback(() => {
    const config = configRef.current;
    const engine = engineRef.current;
    const startSeat = engine?.state.startPlayerId
      ? engine.state.players.find((p) => p.id === engine.state.startPlayerId)?.seat ?? config.startSeat
      : config.startSeat;
    const next = GameEngine.createRoom({
      targetPlayerCount: config.count,
      hostName: config.name,
      ...(config.seed !== undefined ? { seed: config.seed } : {}),
    });
    for (let seat = 2; seat <= config.count; seat += 1) {
      next.apply({ type: 'JOIN_ROOM', isBot: true, name: '', playerId: `p${seat}` }, newActionId());
    }
    next.apply({ type: 'SET_START_PLAYER', playerId: ME, startPlayerId: `p${startSeat}` }, newActionId());
    engineRef.current = next;
    configRef.current = { ...config, startSeat };
    setStuck(false);
    setBotError('');
    setView(getGameView(next, ME));
    setScreen('room');
  }, []);

  const retryBots = () => {
    setBotError('');
    setStuck(false);
  };

  return (
    <div className="app">
      {botError ? (
        <div className="banner banner--error" role="alert">
          <span>{botError}。对局已暂停，进度已保存到本地。</span>
          <div className="banner__actions">
            <button type="button" className="btn btn--tiny" onClick={retryBots}>
              重试
            </button>
            <button type="button" className="btn btn--tiny" onClick={backHome}>
              返回首页
            </button>
          </div>
        </div>
      ) : null}

      {screen === 'home' ? (
        <HomeScreen
          onCreate={createRoom}
          onDemo={() => setScreen('demo')}
          hasSavedGame={Boolean(savedSnapshot)}
          onContinue={continueSaved}
        />
      ) : null}

      {screen === 'demo' ? <DemoScreen onBack={backHome} /> : null}

      {screen === 'room' && view ? (
        <RoomScreen
          view={view}
          onJoinBot={joinBot}
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
        <ResultScreen
          view={view}
          onRestart={restart}
          onReturnRoom={returnToRoom}
          onHome={backHome}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
