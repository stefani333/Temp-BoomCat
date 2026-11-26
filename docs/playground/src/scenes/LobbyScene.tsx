import type { Seat, Setup } from '../types';

interface LobbySceneProps {
  setup: Setup;
  seats: Seat[];
  onToggleReady: () => void;
  onJoin: () => void;
  onStart: () => void;
  onBack: () => void;
}

export function LobbyScene({
  setup,
  seats,
  onToggleReady,
  onJoin,
  onStart,
  onBack,
}: LobbySceneProps) {
  const joined = seats.filter((seat) => Boolean(seat.id));
  const me = joined.find((seat) => seat.id === 'p1');
  const full = joined.length >= setup.target;
  const emptySeats = Math.max(0, setup.target - joined.length);
  const blocker = !full ? '人数不足' : joined.some((seat) => !seat.ready) ? '有玩家未准备' : null;
  const canStart = blocker === null;

  return (
    <div className="wf-screen lobby-screen">
      <header className="wf-top">
        <div>
          <div className="wf-subtitle">房间 LOCAL-0001</div>
          <h2 className="wf-top-title">等待开局</h2>
        </div>
        <button type="button" className="wf-btn ghost small" onClick={onBack}>
          返回首页
        </button>
      </header>

      <main className="lobby-main">
        <section className="wf-panel">
          <div className="room-meta">
            <span>目标人数 {setup.target} 人</span>
            <span>当前 {joined.length} / {setup.target}</span>
            <span>{full ? '人数已满' : `还差 ${emptySeats} 人`}</span>
          </div>

          <ul className="seat-list">
            {seats.map((seat, index) => (
              <li key={`${seat.id || 'empty'}-${index}`} className={`seat-row${seat.id ? '' : ' seat-row--empty'}`}>
                <span className="seat-index">{index + 1}</span>
                <span className="seat-name">
                  {seat.id ? seat.name : '空位'}
                  {seat.host ? <em className="seat-tag">房主</em> : null}
                  {seat.id && seat.kind === 'bot' ? <em className="seat-tag">模拟</em> : null}
                </span>
                {seat.id ? (
                  <span className={seat.ready ? 'seat-ready' : 'seat-wait'}>
                    {seat.ready ? '已准备' : '未准备'}
                  </span>
                ) : (
                  <button type="button" className="wf-btn small" onClick={onJoin}>
                    加入模拟玩家
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="lobby-actions">
            <button type="button" className="wf-btn" onClick={onJoin} disabled={full}>
              加入模拟玩家
            </button>
            <button type="button" className="wf-btn accent" onClick={onToggleReady}>
              {me?.ready ? '取消准备' : '我准备'}
            </button>
          </div>

          <label className="wf-field">
            <span className="wf-label">起始玩家</span>
            <p className="wf-help">
              新开一局由房主先手，后续对局由上一局胜者先手，无需手动指定。
            </p>
          </label>

          {blocker ? (
            <p className="wf-hint wf-hint--warn">开始条件未满足：{blocker}</p>
          ) : (
            <p className="wf-hint wf-hint--ok">条件已满足，可以开始游戏。开始后房间锁定。</p>
          )}

          <button
            type="button"
            className="wf-btn primary wf-block-btn"
            onClick={onStart}
            disabled={!canStart}
          >
            开始游戏
          </button>
        </section>

        <section className="wf-panel wf-panel--muted lobby-notes">
          <div className="wf-panel-title">开局说明</div>
          <ul className="wf-list">
            <li>每位玩家初始 5 张手牌，其中 1 张拆除（消火）。</li>
            <li>炸弹猫数量：2 人 2 张、3 人 2 张、4 人 3 张、5 人 4 张。</li>
            <li>拆除放回：2 人局仅放回 2 张，3 至 5 人局全部放回。</li>
            <li>起始玩家自动确定：新开一局为房主，后续对局为上一局胜者。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
