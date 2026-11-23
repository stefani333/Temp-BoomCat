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
          <div className="wf-brand">BOMB CAT</div>
          <div className="wf-subtitle">对局结束</div>
        </div>
        <div className="wf-strong">本地对局</div>
      </header>

      <main className="result-main">
        <section className="wf-panel">
          <div className="result-summary">
            <div>
              <span className="wf-label">获胜者</span>
              <strong className="result-winner">{result.winner}</strong>
            </div>
            <div>
              <span className="wf-label">对局轮次</span>
              <strong>第 {result.rounds} 轮</strong>
            </div>
            <div>
              <span className="wf-label">存活人数</span>
              <strong>{result.survivors}</strong>
            </div>
          </div>
        </section>

        <section className="wf-panel">
          <div className="wf-panel-title">关键事件</div>
          <ul className="wf-list">
            {result.keyEvents.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>
        </section>

        <section className="wf-panel">
          <div className="wf-panel-title">对局日志（可滚动，可展开全部）</div>
          <ul className="log-list log-list--full">
            {result.log.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </section>

        <div className="result-actions">
          <button type="button" className="wf-btn primary" onClick={onRestart}>
            再来一局
          </button>
          <button type="button" className="wf-btn" onClick={onLobby}>
            返回房间
          </button>
          <button type="button" className="wf-btn ghost" onClick={onHome}>
            首页
          </button>
        </div>

        <p className="wf-help">对局已结束时，拒绝改变状态的操作，并返回本结算页。</p>
      </main>
    </div>
  );
}
