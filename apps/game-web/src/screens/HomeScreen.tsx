import { useState } from 'react';

interface HomeScreenProps {
  onCreate: (count: 2 | 3 | 4 | 5, name: string, seed: number | undefined) => void;
  onDemo: () => void;
  hasSavedGame: boolean;
  onContinue: () => void;
}

const COUNTS: Array<2 | 3 | 4 | 5> = [2, 3, 4, 5];

const RULE_SECTIONS = [
  {
    title: '目标与回合',
    items: [
      '最后存活的玩家获胜。',
      '回合内可以打出任意数量可打出的卡牌，也可以直接抽牌结束回合。',
      '抽到的牌不是炸弹猫时加入手牌，然后轮到下一位存活玩家。',
    ],
  },
  {
    title: '卡牌效果',
    items: [
      '休想：取消其他玩家的卡牌效果，可被另一张休想反制；不能取消炸弹猫与拆除。',
      '攻击：立即结束本回合且不抽牌，下一位玩家需进行两个回合。',
      '跳过：不抽牌，直接结束当前一个回合。',
      '洗混：重新洗乱抽牌堆，之后仍按正常流程结束回合。',
      '预见未来：查看抽牌堆顶部三张，按原顺序放回，仅自己可见。',
      '恩惠：指定一名有手牌的玩家，由其选择一张手牌交给你。',
    ],
  },
  {
    title: '特殊猫咪组合',
    items: [
      '两张相同猫咪：从目标手牌中随机抽取一张。',
      '三张相同猫咪：指定一种卡牌名称，目标有该牌时必须交出一张；不能指定炸弹猫。',
      '五张不同猫咪：从弃牌堆选择一张加入手牌。',
      '恩惠、两张猫咪、三张猫咪均不能选择手牌为空的玩家。',
    ],
  },
  {
    title: '炸弹与淘汰',
    items: [
      '抽到炸弹猫必须立即处理。',
      '有拆除时可打出一张，并秘密把炸弹猫放回抽牌堆任意位置，本回合结束。',
      '没有拆除则被淘汰，全部手牌移出本局。',
      '每次淘汰后若仅剩一名存活玩家，该玩家获胜。',
      '炸弹猫数量：2 人 2 张、3 人 2 张、4 人 3 张、5 人 4 张。',
    ],
  },
];

export function HomeScreen({ onCreate, onDemo, hasSavedGame, onContinue }: HomeScreenProps) {
  const [count, setCount] = useState<2 | 3 | 4 | 5>(4);
  const [name, setName] = useState('我');
  const [seed, setSeed] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  const chooseCount = (value: 2 | 3 | 4 | 5) => {
    setCount(value);
  };

  const submit = () => {
    const trimmed = name.trim();
    const seedValue = seed.trim() === '' ? undefined : Number(seed);
    onCreate(
      count,
      trimmed || '我',
      Number.isFinite(seedValue) ? seedValue : undefined,
    );
  };

  return (
    <div className="shell shell--home">
      <div className="hero">
        <p className="hero__eyebrow">BOMB CAT · 本地对局 MVP</p>
        <h1 className="hero__title">
          炸弹猫咪
          <span>别抽到炸弹</span>
        </h1>
        <p className="hero__desc">
          2 至 5 人回合制抽牌淘汰。活得最久的那只猫赢。本页面为规则引擎驱动的可运行对局，其余座位由模拟玩家自动补位。
        </p>
        <div className="hero__cards" aria-hidden="true">
          <span className="hero-card hero-card--1">BOMB</span>
          <span className="hero-card hero-card--2">DEFUSE</span>
          <span className="hero-card hero-card--3">NOPE</span>
          <span className="hero-card hero-card--4">CAT</span>
        </div>
      </div>

      <section className="panel home-form">
        <h2>创建房间</h2>

        {hasSavedGame ? (
          <div className="home-resume">
            <p className="hint hint--ok">检测到本地保存的对局，刷新或关闭页面后可继续。</p>
            <button type="button" className="btn btn--accent btn--block" onClick={onContinue}>
              继续上局
            </button>
          </div>
        ) : null}

        <label className="field">
          <span>昵称</span>
          <input value={name} maxLength={12} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="field">
          <span>目标人数</span>
          <div className="segmented">
            {COUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className={value === count ? 'is-active' : ''}
                onClick={() => chooseCount(value)}
              >
                {value} 人
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>随机种子（可选，用于复现对局）</span>
          <input
            value={seed}
            inputMode="numeric"
            placeholder="留空则随机"
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
        <button type="button" className="btn btn--primary btn--block" onClick={submit}>
          创建并进入房间
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onDemo}>
          自动演示一局（全模拟玩家）
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setRulesOpen(true)}>
          查看规则
        </button>
        <p className="panel__note">
          目标人数创建后不可修改。起始玩家由系统确定：新开一局为房主，后续对局为上一局胜者。达到目标人数且全员准备后才能开始。
        </p>
      </section>

      {rulesOpen ? (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-label="规则摘要">
            <h3>规则摘要</h3>
            <p className="modal__desc">内容摘自规则文档，完整规则以文档为准。</p>
            <div className="rules-body">
              {RULE_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h4>{section.title}</h4>
                  <ul className="plain-list">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--primary" onClick={() => setRulesOpen(false)}>
                知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
