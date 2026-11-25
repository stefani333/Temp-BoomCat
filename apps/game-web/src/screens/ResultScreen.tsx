import type { GameView } from '@bombcat/game-core';

interface ResultScreenProps {
  view: GameView;
  onRestart: () => void;
  onReturnRoom: () => void;
  onHome: () => void;
}

export function ResultScreen({ view, onRestart, onReturnRoom, onHome }: ResultScreenProps) {
  const winner = view.players.find((p) => p.id === view.winnerPlayerId);
  const alive = view.players.filter((p) => p.alive).length;
  const keyEvents = view.events.filter((event) =>
    ['elimination', 'finish', 'bomb', 'counter'].includes(event.kind));

  return (
    <div className="shell shell--narrow">
      <header className="topbar">
        <div>
          <p className="topbar__eyebrow">对局结束 · 房间 {view.roomId}</p>
          <h2>结算</h2>
        </div>
        <span className="tag">第 {view.turnNumber} 回合</span>
      </header>

      <section className="panel result-hero">
        <p className="result-hero__label">获胜者</p>
        <h1>{winner?.name ?? '无'}</h1>
        <p className="result-hero__meta">存活人数 {alive} · 参与人数 {view.players.length}</p>
      </section>

      <section className="panel">
        <h3>玩家结果</h3>
        <ul className="seat-list">
          {view.players.map((player) => (
            <li key={player.id} className={player.alive ? 'seat' : 'seat seat--out'}>
              <span className="seat__index">{player.seat}</span>
              <span className="seat__name">
                {player.name}
                {player.id === view.winnerPlayerId ? <em>获胜</em> : null}
                {player.isBot ? <em>模拟</em> : null}
              </span>
              <span className={player.alive ? 'seat__ready' : 'seat__wait'}>
                {player.alive ? '存活' : '已淘汰'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>关键事件</h3>
        <ul className="key-events">
          {keyEvents.map((event) => (
            <li key={event.seq}>{event.message}</li>
          ))}
          {keyEvents.length === 0 ? <li>无关键事件记录</li> : null}
        </ul>
      </section>

      <section className="panel panel--muted">
        <h3>完整对局日志</h3>
        <div className="event-log event-log--full">
          {view.events.map((event) => (
            <p key={event.seq} className={`event event--${event.kind}`}>
              <span>{String(event.seq).padStart(2, '0')}</span>
              {event.message}
            </p>
          ))}
        </div>
      </section>

      <div className="result-actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          再来一局
        </button>
        <button type="button" className="btn btn--accent" onClick={onReturnRoom}>
          返回房间
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          返回首页
        </button>
      </div>
    </div>
  );
}
