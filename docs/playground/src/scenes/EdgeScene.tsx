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
    copy: '提示还差 N 人，开始按钮禁用。',
  },
  {
    key: 'eliminated',
    title: '本人已被淘汰',
    location: '牌桌',
    copy: '本人页面显示已被淘汰提示，可继续观战，无法再出牌或抽牌。',
  },
  {
    key: 'bot-turn',
    title: '非本人回合操作',
    location: '牌桌',
    copy: '出牌与抽牌按钮禁用，提示等待当前玩家。',
  },
  {
    key: 'empty-discard',
    title: '弃牌堆为空',
    location: '出牌面板',
    copy: '五张不同猫咪组合不可用，提示弃牌堆为空。',
  },
  {
    key: 'no-defuse',
    title: '无拆除卡',
    location: '炸弹处理',
    copy: '仅可确认淘汰，并提示即将移出本局。',
  },
  {
    key: 'empty-draw',
    title: '抽牌堆为空',
    location: '牌桌',
    copy: '提示牌堆异常，禁止抽牌并记录问题。',
  },
  {
    key: 'finished',
    title: '对局已结束',
    location: '全局',
    copy: '拒绝改变状态的操作，并返回结算页。',
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
          <div className="wf-brand">BOMB CAT</div>
          <div className="wf-subtitle">空态与异常提示</div>
        </div>
        <div className="wf-muted">共 {CASES.length} 类状态</div>
      </header>

      <main className="edge-main">
        <p className="wf-help">
          每张卡片对应线框稿第 8 节的空态或异常场景。点击「查看对应状态」可直接进入对应页面与状态。
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
