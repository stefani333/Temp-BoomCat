import { DEFAULT_RESULT } from '../game';
import type { ResultData } from '../types';

interface ResultSceneProps {
  result?: ResultData;
  onRestart: () => void;
  onLobby: () => void;
  onHome: () => void;
}

export function ResultScene({
  result = DEFAULT_RESULT,
  onRestart,
  onLobby,
  onHome,
}: ResultSceneProps) {
  return (
    <div className="wf-screen result-screen">
      <header className="wf-top">
        <div>
          <div className="wf-subtitle">对局结束 · 房间 {result.roomId}</div>
          <h2 className="wf-top-title">结算</h2>
        </div>
        <span className="wf-tag">第 {result.turnNumber} 回合</span>
      </header>

      <main className="result-main">
        <section className="wf-panel result-hero">
          <p className="result-hero-label">获胜者</p>
          <h1 className="result-hero-name">{result.winner}</h1>
          <p className="result-hero-meta">
            存活人数 {result.survivors} · 参与人数 {result.participants}
          </p>
        </section>

        <section className="wf-panel">
          <div className="wf-panel-title">玩家结果</div>
          <ul className="seat-list">
            {result.players.map((player, index) => (
              <li key={player.id} className={`seat-row${player.alive ? '' : ' seat-row--out'}`}>
                <span className="seat-index">{index + 1}</span>
                <span className="seat-name">
                  {player.name}
                  {player.winner ? <em className="seat-tag">获胜</em> : null}
                  {player.isBot ? <em className="seat-tag">模拟</em> : null}
                </span>
                <span className={player.alive ? 'seat-ready' : 'seat-wait'}>
                  {player.alive ? '存活' : '已淘汰'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="wf-panel">
          <div className="wf-panel-title">关键事件</div>
          <ul className="wf-list key-events">
            {result.keyEvents.map((event) => (
              <li key={event}>{event}</li>
            ))}
            {result.keyEvents.length === 0 ? <li>无关键事件记录</li> : null}
          </ul>
        </section>

        <section className="wf-panel wf-panel--muted">
          <div className="wf-panel-title">完整对局日志</div>
          <div className="g-log g-log--full">
            {result.log.map((line, index) => (
              <p className="g-event" key={`${line}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {line}
              </p>
            ))}
          </div>
        </section>

        <div className="result-actions">
          <button type="button" className="wf-btn primary" onClick={onRestart}>
            再来一局
          </button>
          <button type="button" className="wf-btn accent" onClick={onLobby}>
            返回房间
          </button>
          <button type="button" className="wf-btn ghost" onClick={onHome}>
            返回首页
          </button>
        </div>
      </main>
    </div>
  );
}
