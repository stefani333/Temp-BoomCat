import { useState } from 'react';
import type { PlayerCount, Setup } from '../types';
import { Modal } from '../ui';

const COUNTS: PlayerCount[] = [2, 3, 4, 5];

interface HomeSceneProps {
  setup: Setup;
  onChange: (patch: Partial<Setup>) => void;
  onEnterLobby: () => void;
}

export function HomeScene({ setup, onChange, onEnterLobby }: HomeSceneProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="wf-screen home-screen">
      <header className="wf-top">
        <div>
          <div className="wf-brand">BOMB CAT</div>
          <div className="wf-subtitle">炸弹猫咪 本地对局</div>
        </div>
        <button type="button" className="wf-btn small" onClick={() => setRulesOpen(true)}>
          查看规则
        </button>
      </header>

      <main className="home-main">
        <div className="home-grid">
          <section className="wf-panel home-form">
            <div className="wf-panel-title">创建房间</div>

            <div className="wf-field">
              <span className="wf-label">目标人数</span>
              <div className="wf-seg">
                {COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`wf-chip${setup.target === count ? ' active' : ''}`}
                    onClick={() => onChange({ target: count })}
                  >
                    {count} 人
                  </button>
                ))}
              </div>
              <p className="wf-help">目标人数创建后锁定，房间内不提供修改入口。</p>
            </div>

            <p className="wf-help">起始玩家由系统自动确定：新开一局为房主，后续对局为上一局胜者。</p>

            <label className="wf-field">
              <span className="wf-label">随机种子（可选）</span>
              <input
                className="wf-input"
                value={setup.seed}
                placeholder="留空则随机生成"
                onChange={(event) => onChange({ seed: event.target.value })}
              />
              <span className="wf-help">随机种子用于复现对局。</span>
            </label>

            <button type="button" className="wf-btn primary wf-block-btn" onClick={onEnterLobby}>
              创建并进入房间
            </button>
          </section>

          <aside className="wf-panel home-aside">
            <div className="wf-panel-title">当前版本说明</div>
            <ul className="wf-list">
              <li>本地对局，真人 1 席</li>
              <li>模拟玩家自动补位</li>
              <li>支持 2 至 5 人</li>
              <li>起始玩家自动确定（房主或上一局胜者）</li>
              <li>随机种子用于复现对局</li>
            </ul>
            <div className="wf-note">
              <span className="wf-note-mark">说明</span>
              <span>本页为低保真结构稿，仅表达信息层级与交互入口。</span>
            </div>
          </aside>
        </div>

        <div className="home-footer">
          <span className="wf-muted">规则摘要入口</span>
          <button type="button" className="wf-btn ghost small" onClick={() => setRulesOpen(true)}>
            查看规则
          </button>
        </div>
      </main>

      {rulesOpen ? (
        <Modal
          title="规则摘要"
          onClose={() => setRulesOpen(false)}
          footer={
            <button type="button" className="wf-btn primary" onClick={() => setRulesOpen(false)}>
              知道了
            </button>
          }
        >
          <ul className="wf-list">
            <li>2 至 5 人本地对局，真人 1 席，其余为模拟玩家。</li>
            <li>每回合可出牌或抽牌，抽到炸弹猫需使用拆除，否则淘汰。</li>
            <li>特殊猫咪按张数组成组合：两张相同、三张相同或五张不同。</li>
            <li>部分卡牌可被休想反制，拆除处理不可被休想取消。</li>
            <li>起始玩家在开局前指定，随机种子用于复现对局。</li>
          </ul>
        </Modal>
      ) : null}
    </div>
  );
}
