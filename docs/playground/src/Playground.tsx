import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_SETUP,
  PLAYER_NAMES,
  makeDemoTable,
  makeSeats,
  makeTableFromSeats,
} from './game';
import { GROUPS, PAGES, findPage } from './pages';
import type { DeviceKind, PageMeta, ScreenId, Seat, Setup, TableState } from './types';
import { DemoScene } from './scenes/DemoScene';
import { EdgeScene, type EdgeCaseKey } from './scenes/EdgeScene';
import { HomeScene } from './scenes/HomeScene';
import { LobbyScene } from './scenes/LobbyScene';
import { ResultScene } from './scenes/ResultScene';
import { TableScene } from './scenes/TableScene';

const ZOOMS = [0.5, 0.75, 1] as const;

function tableForPage(target: PageMeta): TableState {
  const base = makeDemoTable();
  if (target.id === 'table-eliminated') {
    return {
      ...base,
      seats: base.seats.map((seat) => (
        seat.id === 'p1' ? { ...seat, alive: false, handCount: 0 } : seat
      )),
      hand: [],
      currentId: 'p2',
      log: [
        ...base.log,
        '我抽到炸弹猫，未持有拆除',
        '我被淘汰，全部手牌移出本局，可继续观战',
      ],
    };
  }
  if (target.id === 'play-counter') {
    return {
      ...base,
      pendingLabel: '攻击（高潮）',
      pendingStatus: '等待 我 决定是否使用休想',
      counterDepth: 1,
    };
  }
  if (target.id === 'play-favor') {
    return {
      ...base,
      pendingLabel: '恩惠（调情）',
      pendingStatus: '等待 我 选择交出的手牌',
    };
  }
  if (target.id === 'bomb') {
    return {
      ...base,
      pendingLabel: '炸弹猫',
      pendingStatus: '等待 我 决定是否使用拆除',
    };
  }
  if (target.id === 'bomb-place') {
    return {
      ...base,
      pendingLabel: '炸弹猫',
      pendingStatus: '等待 我 秘密选择放回位置',
    };
  }
  if (target.id === 'effect-foresee') {
    return {
      ...base,
      pendingLabel: '预见未来（幻觉）',
      pendingStatus: '等待 我 查看结果',
    };
  }
  return base;
}

export default function Playground() {
  const [setup, setSetup] = useState<Setup>({ ...DEFAULT_SETUP });
  const [seats, setSeats] = useState<Seat[]>(() => makeSeats(DEFAULT_SETUP.target));
  const [table, setTable] = useState<TableState>(() => makeDemoTable());
  const [scene, setScene] = useState<ScreenId>('home');
  const [pageId, setPageId] = useState('home');
  const [device, setDevice] = useState<DeviceKind>('phone');
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  const page = findPage(pageId);
  const frameWidth = device === 'phone' ? 390 : 1440;

  const grouped = useMemo(
    () => GROUPS.map((group) => ({ group, pages: PAGES.filter((item) => item.group === group) })),
    [],
  );

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const fit = () => {
      const available = element.clientWidth - 56;
      const scale = [...ZOOMS].reverse().find((value) => frameWidth * value <= available);
      setZoom(scale ?? ZOOMS[0]);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [frameWidth]);

  useEffect(() => {
    canvasRef.current?.scrollTo({ top: 0 });
  }, [pageId]);

  const updateSetup = (patch: Partial<Setup>) => {
    setSetup((prev) => ({ ...prev, ...patch }));
  };

  const openPage = (target: PageMeta) => {
    setPageId(target.id);
    setScene(target.screen);
    if (target.device) setDevice(target.device);
    if (target.screen === 'table') setTable(tableForPage(target));
  };

  const changeDevice = (next: DeviceKind) => {
    setDevice(next);
    if (pageId === 'table-mobile' || pageId === 'table-desktop') {
      setPageId(next === 'desktop' ? 'table-desktop' : 'table-mobile');
    }
  };

  const enterLobby = () => {
    setSeats(makeSeats(setup.target));
    setScene('lobby');
    setPageId('lobby');
  };

  const enterDemo = () => {
    setScene('demo');
    setPageId('demo');
  };

  const toggleReady = () => {
    setSeats((prev) => prev.map((seat) => (
      seat.id === 'p1' ? { ...seat, ready: !seat.ready } : seat
    )));
  };

  const joinBot = () => {
    setSeats((prev) => {
      const index = prev.findIndex((seat) => !seat.id);
      if (index < 0) return prev;
      const next = [...prev];
      next[index] = {
        id: `p${index + 1}`,
        name: PLAYER_NAMES[index] ?? `模拟玩家 ${index}`,
        kind: 'bot',
        ready: true,
        alive: true,
        handCount: 0,
      };
      return next;
    });
  };

  const startGame = () => {
    setTable(makeTableFromSeats(seats));
    setScene('table');
    setPageId(device === 'desktop' ? 'table-desktop' : 'table-mobile');
  };

  const updateTable = (patch: Partial<TableState>) => {
    setTable((prev) => ({ ...prev, ...patch }));
  };

  const advanceTurn = () => {
    setTable((prev) => {
      const alive = prev.seats.filter((seat) => seat.alive);
      if (alive.length === 0) return prev;
      const index = alive.findIndex((seat) => seat.id === prev.currentId);
      const next = alive[(index + 1) % alive.length]!;
      return {
        ...prev,
        currentId: next.id,
        round: next.id === 'p1' ? prev.round + 1 : prev.round,
        log: [...prev.log, `演示推进：当前玩家 ${next.name}`],
      };
    });
  };

  const restartGame = () => {
    setTable(makeTableFromSeats(seats));
    setScene('table');
    setPageId(device === 'desktop' ? 'table-desktop' : 'table-mobile');
  };

  const backHome = () => {
    setScene('home');
    setPageId('home');
  };

  const backLobby = () => {
    setScene('lobby');
    setPageId('lobby');
  };

  const gotoEdgeCase = (key: EdgeCaseKey) => {
    switch (key) {
      case 'underfilled':
        setSetup((prev) => ({ ...prev, target: 4 }));
        setSeats(makeSeats(4).slice(0, 2));
        setScene('lobby');
        setPageId('lobby');
        break;
      case 'eliminated':
        setTable(tableForPage(findPage('table-eliminated')));
        setDevice('phone');
        setScene('table');
        setPageId('table-eliminated');
        break;
      case 'bot-turn':
        setTable((prev) => ({
          ...prev,
          currentId: 'p2',
          log: [...prev.log, '演示：当前玩家切换为模拟玩家 A'],
        }));
        setScene('table');
        setPageId(device === 'desktop' ? 'table-desktop' : 'table-mobile');
        break;
      case 'empty-discard':
        setTable({ ...makeDemoTable(), discardCount: 0, discardTop: '暂无弃牌' });
        setDevice('phone');
        setScene('table');
        setPageId('play-discard');
        break;
      case 'no-defuse':
        setTable({
          ...makeDemoTable(),
          hand: makeDemoTable().hand.filter((card) => card.kind !== 'defuse'),
          pendingLabel: '炸弹猫',
          pendingStatus: '等待 我 决定是否使用拆除',
        });
        setDevice('phone');
        setScene('table');
        setPageId('bomb');
        break;
      case 'empty-draw':
        setTable((prev) => ({ ...prev, drawPile: 0 }));
        setScene('table');
        setPageId(device === 'desktop' ? 'table-desktop' : 'table-mobile');
        break;
      case 'finished':
        setScene('result');
        setPageId('result');
        break;
      default:
        break;
    }
  };

  const resetAll = () => {
    setSetup({ ...DEFAULT_SETUP });
    setSeats(makeSeats(DEFAULT_SETUP.target));
    setTable(makeDemoTable());
    setDevice('phone');
    setScene('home');
    setPageId('home');
  };

  const renderScene = () => {
    if (scene === 'home') {
      return (
        <HomeScene
          setup={setup}
          onChange={updateSetup}
          onEnterLobby={enterLobby}
          onDemo={enterDemo}
        />
      );
    }
    if (scene === 'lobby') {
      return (
        <LobbyScene
          setup={setup}
          seats={seats}
          onToggleReady={toggleReady}
          onJoin={joinBot}
          onStart={startGame}
          onBack={backHome}
        />
      );
    }
    if (scene === 'demo') {
      return <DemoScene onBack={backHome} />;
    }
    if (scene === 'table') {
      return (
        <TableScene
          key={pageId}
          table={table}
          initialOverlay={page.overlay}
          initialSelection={page.initialSelection}
          onUpdate={updateTable}
        />
      );
    }
    if (scene === 'result') {
      return <ResultScene onRestart={restartGame} onLobby={backLobby} onHome={backHome} />;
    }
    return <EdgeScene onGoto={gotoEdgeCase} />;
  };

  return (
    <div className="pg-root">
      <header className="pg-top">
        <div className="pg-brand">
          <span className="pg-brand-mark">BC</span>
          <div>
            <div className="pg-brand-name">BOMB CAT 线框预览台</div>
            <div className="pg-brand-sub">游戏网页移动端 · {PAGES.length} 个线框页面</div>
          </div>
        </div>

        <div className="pg-spacer" />

        <div className="pg-seg" role="group" aria-label="设备">
          <button
            type="button"
            className={device === 'phone' ? 'active' : ''}
            onClick={() => changeDevice('phone')}
          >
            手机 390
          </button>
          <button
            type="button"
            className={device === 'desktop' ? 'active' : ''}
            onClick={() => changeDevice('desktop')}
          >
            桌面 1440
          </button>
        </div>

        <div className="pg-seg" role="group" aria-label="缩放">
          {ZOOMS.map((value) => (
            <button
              key={value}
              type="button"
              className={zoom === value ? 'active' : ''}
              onClick={() => setZoom(value)}
            >
              {value * 100}%
            </button>
          ))}
        </div>

        <button type="button" className="pg-mini" onClick={resetAll}>
          重置演示
        </button>
      </header>

      <div className="pg-body">
        <aside className="pg-side">
          <div className="pg-side-head">
            <span>页面清单</span>
            <span className="pg-count">{PAGES.length}</span>
          </div>
          <div className="pg-side-list">
            {grouped.map(({ group, pages }) => {
              const isCollapsed = Boolean(collapsed[group]);
              return (
                <div className="pg-group" key={group}>
                  <button
                    type="button"
                    className="pg-group-head"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
                    }
                  >
                    <span>{group}</span>
                    <span className="pg-count">{pages.length}</span>
                  </button>
                  {!isCollapsed ? (
                    <div className="pg-group-items">
                      {pages.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`pg-item${pageId === item.id ? ' active' : ''}`}
                          onClick={() => openPage(item)}
                          title={item.summary}
                        >
                          <span className="pg-item-no">{String(item.no).padStart(2, '0')}</span>
                          <span className="pg-item-name">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="pg-stage">
          <div className="pg-stage-head">
            <div className="pg-stage-title">
              <span className="pg-item-no">{String(page.no).padStart(2, '0')}</span>
              <strong>{page.title}</strong>
            </div>
            <span className="pg-stage-note">{page.summary}</span>
            <div className="pg-spacer" />
            {scene === 'table' ? (
              <>
                <button type="button" className="pg-mini" onClick={advanceTurn}>
                  推进回合
                </button>
                <button
                  type="button"
                  className="pg-mini"
                  onClick={() => setTable(tableForPage(page))}
                >
                  重置对局
                </button>
              </>
            ) : null}
            <span className="pg-stage-meta">
              {device === 'phone' ? '390 宽' : '1440 宽'} · {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="pg-canvas" ref={canvasRef}>
            <div className="pg-frame" style={{ width: frameWidth * zoom }}>
              <div
                className="pg-frame-screen"
                data-device={device}
                style={{ width: frameWidth, zoom }}
              >
                {renderScene()}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="pg-foot">
        线框依据 docs/05-UI设计/01-游戏端低保真线框图.md，仅表达信息层级、区域划分与交互入口，不包含业务逻辑。
      </footer>
    </div>
  );
}
