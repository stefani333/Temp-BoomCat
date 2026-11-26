import { useState } from 'react';
import { DEFAULT_DEMO } from '../game';
import type { DemoOutcome, PlayerCount } from '../types';

const COUNTS: PlayerCount[] = [2, 3, 4, 5];

interface DemoSceneProps {
  onBack: () => void;
}

export function DemoScene({ onBack }: DemoSceneProps) {
  const [count, setCount] = useState<PlayerCount>(4);
  const [seed, setSeed] = useState('20261123');
  const [outcome, setOutcome] = useState<DemoOutcome | null>(DEFAULT_DEMO);

  return (
    <div className="wf-screen demo-screen">
      <header className="wf-top">
        <div>
          <div className="wf-subtitle">验证工具</div>
          <h2 className="wf-top-title">自动演示一局</h2>
        </div>
        <button type="button" className="wf-btn ghost small" onClick={onBack}>
          返回首页
        </button>
      </header>

      <main className="demo-main">
        <section className="wf-panel">
          <p className="wf-help">
            使用与真人模式相同的规则引擎，由模拟玩家完整打完一局，用于快速验证多人数对局、炸弹淘汰与胜负结算。
          </p>
          <div className="wf-field">
            <span className="wf-label">参与人数</span>
            <div className="wf-seg">
              {COUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`wf-chip${value === count ? ' active' : ''}`}
                  onClick={() => setCount(value)}
                >
                  {value} 人
                </button>
              ))}
            </div>
          </div>
          <label className="wf-field">
            <span className="wf-label">随机种子</span>
            <input
              className="wf-input"
              value={seed}
              inputMode="numeric"
              onChange={(event) => setSeed(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="wf-btn primary wf-block-btn"
            onClick={() => setOutcome(DEFAULT_DEMO)}
          >
            运行自动对局
          </button>
        </section>

        {outcome ? (
          <section className="wf-panel">
            <div className="wf-panel-title">{outcome.finished ? '对局完成' : '对局未完成'}</div>
            <dl className="demo-stats">
              <div>
                <dt>获胜者</dt>
                <dd>{outcome.winner}</dd>
              </div>
              <div>
                <dt>执行步数</dt>
                <dd>{outcome.steps}</dd>
              </div>
              <div>
                <dt>参与人数</dt>
                <dd>{outcome.participants}</dd>
              </div>
              <div>
                <dt>存活人数</dt>
                <dd>{outcome.survivors}</dd>
              </div>
            </dl>
            <div className="g-log g-log--full">
              {outcome.log.map((line, index) => (
                <p className="g-event" key={`${line}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              className="wf-btn ghost wf-block-btn"
              onClick={() => setOutcome(DEFAULT_DEMO)}
            >
              再跑一局
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
