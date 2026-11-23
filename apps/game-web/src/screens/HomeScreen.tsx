import { useState } from 'react';

interface HomeScreenProps {
  onCreate: (count: 2 | 3 | 4 | 5, name: string, seed?: number) => void;
  onDemo: () => void;
}

const COUNTS: Array<2 | 3 | 4 | 5> = [2, 3, 4, 5];

export function HomeScreen({ onCreate, onDemo }: HomeScreenProps) {
  const [count, setCount] = useState<2 | 3 | 4 | 5>(4);
  const [name, setName] = useState('我');
  const [seed, setSeed] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    const seedValue = seed.trim() === '' ? undefined : Number(seed);
    onCreate(count, trimmed || '我', Number.isFinite(seedValue) ? seedValue : undefined);
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
                onClick={() => setCount(value)}
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
        <p className="panel__note">
          目标人数创建后不可修改。房主需指定起始玩家，达到目标人数且全员准备后才能开始。
        </p>
      </section>
    </div>
  );
}
