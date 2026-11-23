import { useState } from 'react';
import { runFullSimulation, type SimulationOutcome } from '@bombcat/game-core';

interface DemoScreenProps {
  onBack: () => void;
}

const COUNTS: Array<2 | 3 | 4 | 5> = [2, 3, 4, 5];

export function DemoScreen({ onBack }: DemoScreenProps) {
  const [count, setCount] = useState<2 | 3 | 4 | 5>(4);
  const [seed, setSeed] = useState('20261123');
  const [outcome, setOutcome] = useState<SimulationOutcome | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    const seedValue = Number(seed);
    const result = runFullSimulation({
      playerCount: count,
      seed: Number.isFinite(seedValue) ? seedValue : Date.now(),
    });
    setOutcome(result);
    setRunning(false);
  };

  return (
    <div className="shell shell--narrow">
      <header className="topbar">
        <div>
          <p className="topbar__eyebrow">验证工具</p>
          <h2>自动演示一局</h2>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          返回首页
        </button>
      </header>

      <section className="panel">
        <p className="panel__note">
          使用与真人模式相同的规则引擎，由模拟玩家完整打完一局，用于快速验证多人数对局、炸弹淘汰与胜负结算。
        </p>
        <div className="field">
          <span>参与人数</span>
          <div className="segmented">
            {COUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className={value === count ? 'is-active' : ''}
                onClick={() => setCount(value)}
              >
                {value} 人
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>随机种子</span>
          <input value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value)} />
        </label>
        <button type="button" className="btn btn--primary btn--block" onClick={run} disabled={running}>
          {running ? '对局运行中' : '运行自动对局'}
        </button>
      </section>

      {outcome ? (
        <section className="panel">
          <h3>{outcome.finished ? '对局完成' : '对局未完成'}</h3>
          <dl className="demo-stats">
            <div>
              <dt>获胜者</dt>
              <dd>{outcome.winnerName ?? '无'}</dd>
            </div>
            <div>
              <dt>执行步数</dt>
              <dd>{outcome.steps}</dd>
            </div>
            <div>
              <dt>参与人数</dt>
              <dd>{outcome.state.players.length}</dd>
            </div>
            <div>
              <dt>存活人数</dt>
              <dd>{outcome.state.players.filter((p) => p.alive).length}</dd>
            </div>
          </dl>
          {outcome.error ? <p className="hint hint--warn">异常：{outcome.error}</p> : null}
          <div className="event-log event-log--full">
            {outcome.state.eventLog.slice(-60).map((event) => (
              <p key={event.seq} className={`event event--${event.kind}`}>
                <span>{String(event.seq).padStart(2, '0')}</span>
                {event.message}
              </p>
            ))}
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={run}>
            再跑一局
          </button>
        </section>
      ) : null}
    </div>
  );
}
