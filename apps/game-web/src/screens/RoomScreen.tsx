import type { GameView } from '@bombcat/game-core';

interface RoomScreenProps {
  view: GameView;
  onJoinBot: () => void;
  onToggleReady: () => void;
  onSetStartPlayer: (playerId: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export function RoomScreen({
  view,
  onJoinBot,
  onToggleReady,
  onSetStartPlayer,
  onStart,
  onBack,
}: RoomScreenProps) {
  const full = view.players.length >= view.targetPlayerCount;
  const emptySeats = Math.max(0, view.targetPlayerCount - view.players.length);

  return (
    <div className="shell shell--narrow">
      <header className="topbar">
        <div>
          <p className="topbar__eyebrow">房间 {view.roomId}</p>
          <h2>等待开局</h2>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          返回首页
        </button>
      </header>

      <section className="panel">
        <div className="room-meta">
          <span>目标人数 {view.targetPlayerCount} 人</span>
          <span>当前 {view.players.length} / {view.targetPlayerCount}</span>
          <span>{full ? '人数已满' : `还差 ${emptySeats} 人`}</span>
        </div>

        <ul className="seat-list">
          {view.players.map((player) => (
            <li key={player.id} className={player.alive ? 'seat' : 'seat seat--out'}>
              <span className="seat__index">{player.seat}</span>
              <span className="seat__name">
                {player.name}
                {player.isHost ? <em>房主</em> : null}
                {player.isBot ? <em>模拟</em> : null}
              </span>
              <span className={player.ready ? 'seat__ready' : 'seat__wait'}>
                {player.ready ? '已准备' : '未准备'}
              </span>
            </li>
          ))}
          {Array.from({ length: emptySeats }).map((_, index) => (
            <li key={`empty-${index}`} className="seat seat--empty">
              <span className="seat__index">{view.players.length + index + 1}</span>
              <span className="seat__name">空位</span>
              <button type="button" className="btn btn--tiny" onClick={onJoinBot}>
                加入模拟玩家
              </button>
            </li>
          ))}
        </ul>

        <div className="room-actions">
          <button type="button" className="btn" onClick={onJoinBot} disabled={full}>
            加入模拟玩家
          </button>
          <button
            type="button"
            className={view.myReady ? 'btn btn--muted' : 'btn btn--accent'}
            onClick={onToggleReady}
          >
            {view.myReady ? '取消准备' : '我准备'}
          </button>
        </div>

        <label className="field">
          <span>起始玩家（房主指定，未指定不可开始）</span>
          <select
            value={view.startPlayerId ?? ''}
            onChange={(event) => onSetStartPlayer(event.target.value)}
          >
            <option value="">请选择起始玩家</option>
            {view.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>

        {view.startBlockReason ? (
          <p className="hint hint--warn">开始条件未满足：{view.startBlockReason}</p>
        ) : (
          <p className="hint hint--ok">条件已满足，可以开始游戏。开始后房间锁定。</p>
        )}

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={onStart}
          disabled={!view.canStart}
        >
          开始游戏
        </button>
      </section>

      <section className="panel panel--muted">
        <h3>开局说明</h3>
        <ul className="plain-list">
          <li>每位玩家初始 5 张手牌，其中 1 张拆除（消火）。</li>
          <li>炸弹猫数量：2 人 2 张、3 人 2 张、4 人 3 张、5 人 4 张。</li>
          <li>拆除放回：2 人局仅放回 2 张，3 至 5 人局全部放回。</li>
          <li>起始玩家由房主指定，本页面由你担任房主。</li>
        </ul>
      </section>
    </div>
  );
}
