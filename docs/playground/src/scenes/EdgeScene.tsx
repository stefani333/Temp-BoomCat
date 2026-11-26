export type EdgeCaseKey =
  | 'underfilled'
  | 'eliminated'
  | 'bot-turn'
  | 'empty-discard'
  | 'no-defuse'
  | 'empty-draw'
  | 'finished';

interface EdgeCase {
  key: EdgeCaseKey;
  title: string;
  location: string;
  copy: string;
}

const CASES: EdgeCase[] = [
  {
    key: 'underfilled',
    title: '人数不足',
    location: '房间等待',
    copy: '元信息显示「还差 N 人」，提示「开始条件未满足：人数不足」，开始按钮禁用。',
  },
  {
    key: 'eliminated',
    title: '本人已被淘汰',
    location: '牌桌',
    copy: '弹出「你已被淘汰」提示，关闭后顶部保留「你已被淘汰，正在观战。」，手牌与操作禁用。',
  },
  {
    key: 'bot-turn',
    title: '非本人回合操作',
    location: '牌桌',
    copy: '手牌不可选择，出牌与抽牌按钮禁用，中区提示「等待 X 行动。」。',
  },
  {
    key: 'empty-discard',
    title: '弃牌堆为空',
    location: '手牌区',
    copy: '五张不同猫咪组合在手牌区行内提示「弃牌堆为空，不能打出五张不同猫咪组合」，不弹窗。',
  },
  {
    key: 'no-defuse',
    title: '无拆除卡',
    location: '炸弹处理',
    copy: '「使用拆除」禁用，仅可「放弃并淘汰」，并需二次确认。',
  },
  {
    key: 'empty-draw',
    title: '抽牌堆为空',
    location: '牌桌',
    copy: '抽牌按钮禁用，手牌区提示「抽牌堆为空，无法抽牌。」，不记录问题事件。',
  },
  {
    key: 'finished',
    title: '对局已结束',
    location: '全局',
    copy: '拒绝改变状态的操作，并进入结算页。',
  },
];

interface EdgeSceneProps {
  onGoto: (key: EdgeCaseKey) => void;
}

export function EdgeScene({ onGoto }: EdgeSceneProps) {
  return (
    <div className="wf-screen edge-screen">
      <header className="wf-top">
        <div>
          <div className="wf-subtitle">BOMB CAT</div>
          <h2 className="wf-top-title">空态与异常提示</h2>
        </div>
        <div className="wf-muted">共 {CASES.length} 类状态</div>
      </header>

      <main className="edge-main">
        <p className="wf-help">
          每张卡片对应线框稿第 9 节的空态或异常场景。点击「查看对应状态」可直接进入对应页面与状态。
        </p>
        <div className="edge-grid">
          {CASES.map((item) => (
            <section className="wf-panel edge-card" key={item.key}>
              <div className="wf-label">{item.location}</div>
              <h4>{item.title}</h4>
              <p>{item.copy}</p>
              <button type="button" className="wf-btn small" onClick={() => onGoto(item.key)}>
                查看对应状态
              </button>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
