import type { Seat, Setup } from '../types';

interface LobbySceneProps {
  setup: Setup;
  seats: Seat[];
  onSetupChange: (patch: Partial<Setup>) => void;
  onToggleReady: (seatId: string) => void;
  onJoin: () => void;
  onStart: () => void;
  onBack: () => void;
}

export function LobbyScene({
  setup,
  seats,
  onSetupChange,
  onToggleReady,
  onJoin,
  onStart,
  onBack,
}: LobbySceneProps) {
  const joined = seats.filter((seat) => Boolean(seat.id));
  const me = joined.find((seat) => seat.id === 'p1');
  const full = joined.length >= setup.target;
  const allReady = full && joined.every((seat) => seat.ready);
  const hasStarter = Boolean(setup.starterId) && joined.some((seat) => seat.id === setup.starterId);
  const canStart = full && allReady && hasStarter;

  const blockers: string[] = [];
  if (!full) blockers.push(`人数不足，还差 ${setup.target - joined.length} 人`);
  if (!allReady) blockers.push('有玩家未准备');
  if (!hasStarter) blockers.push('请指定起始玩家');

  return (
    <div className="wf-screen lobby-screen">
      <header className="wf-top">
        <div>
          <div className="wf-brand">BOMB CAT</div>
          <div className="wf-subtitle">房间等待与准备</div>
        </div>
        <div className="wf-strong">LOCAL-0001</div>
      </header>

      <main className="lobby-main">
        <section className="wf-panel">
          <div className="lobby-meta">
            <span>房间号 LOCAL-0001</span>
            <span>目标人数 {setup.target} 人</span>
            <span>房主：我</span>
          </div>

          <div className="wf-panel-title">座位列表</div>
          <div className="seat-list">
            {seats.map((seat, index) => {
              const isMe = seat.id === 'p1';
              return (
                <div key={index} className={`seat-row${seat.id ? '' : ' seat-row--empty'}`}>
                  <span className="seat-index">{index + 1}</span>
                  <span className="seat-name">
                    {seat.id ? seat.name : '空位'}
                    {seat.host ? <em className="seat-tag">房主</em> : null}
                    {seat.kind === 'bot' && seat.id ? <em className="seat-tag">模拟</em> : null}
                  </span>
                  <span className={seat.ready ? 'seat-ready' : 'seat-wait'}>
                    {seat.id ? (seat.ready ? '已准备' : '未准备') : '—'}
                  </span>
                  {seat.id && !isMe ? (
                    <button
                      type="button"
                      className="wf-btn small"
                      onClick={() => onToggleReady(seat.id)}
                    >
                      {seat.ready ? '取消准备' : '准备'}
                    </button>
                  ) : null}
                  {!seat.id ? (
                    <button type="button" className="wf-btn small" onClick={onJoin}>
                      加入
                    </button>
                  ) : null}
                  {isMe ? <span className="seat-space" /> : null}
                </div>
              );
            })}
          </div>

          <div className="lobby-config">
            <label className="wf-field">
              <span className="wf-label">起始玩家</span>
              <select
                className="wf-input"
                value={hasStarter ? setup.starterId : ''}
                onChange={(event) => onSetupChange({ starterId: event.target.value })}
              >
                <option value="">未指定</option>
                {joined.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    {seat.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="lobby-count">
              <span className="wf-label">人数</span>
              <strong>
                {joined.length} / {setup.target}
              </strong>
            </div>
          </div>

          {blockers.length > 0 ? (
            <div className="wf-hint">
              {blockers.map((text) => (
                <div key={text}>{text}</div>
              ))}
            </div>
          ) : (
            <div className="wf-hint wf-hint--quiet">人数已满、全员已准备、起始玩家已指定，可以开始游戏。</div>
          )}

          <div className="lobby-actions">
            <button type="button" className="wf-btn" onClick={() => onToggleReady('p1')}>
              {me?.ready ? '取消准备' : '我准备'}
            </button>
            <button type="button" className="wf-btn" onClick={onJoin} disabled={full}>
              加入模拟玩家
            </button>
            <button
              type="button"
              className="wf-btn primary"
              onClick={onStart}
              disabled={!canStart}
              title={canStart ? '开始游戏' : blockers.join('；')}
            >
              开始游戏
            </button>
            <button type="button" className="wf-btn ghost" onClick={onBack}>
              返回首页
            </button>
          </div>

          <p className="wf-help">开始后房间锁定，页面切换到游戏牌桌。</p>
        </section>
      </main>
    </div>
  );
}
