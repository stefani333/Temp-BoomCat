import { cardDisplayName, type Card, type CardType } from '@bombcat/game-core';

const TYPE_META: Record<CardType, { code: string; hint: string }> = {
  bomb: { code: 'BOMB', hint: '抽到必须拆除' },
  defuse: { code: 'DEFUSE', hint: '避免淘汰' },
  nope: { code: 'NOPE', hint: '取消卡牌效果' },
  favor: { code: 'FAVOR', hint: '索要一张手牌' },
  attack: { code: 'ATTACK', hint: '下家两个回合' },
  skip: { code: 'SKIP', hint: '不抽牌结束回合' },
  shuffle: { code: 'SHUFFLE', hint: '洗乱抽牌堆' },
  seeFuture: { code: 'FUTURE', hint: '查看顶部三张' },
  cat: { code: 'CAT', hint: '组合出牌' },
};

interface CardViewProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function CardView({ card, selected, disabled, compact, onClick }: CardViewProps) {
  const meta = TYPE_META[card.type];
  const className = [
    'card',
    `card--${card.type}`,
    card.cat ? `card--cat-${card.cat}` : '',
    selected ? 'is-selected' : '',
    compact ? 'card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={`${cardDisplayName(card)}：${meta.hint}`}
    >
      <span className="card__code">{meta.code}</span>
      <span className="card__art" aria-hidden="true">
        {card.type === 'cat' ? <CatFace /> : <span className="card__glyph">{meta.code.slice(0, 3)}</span>}
      </span>
      <span className="card__name">{cardDisplayName(card)}</span>
      <span className="card__hint">{meta.hint}</span>
    </button>
  );
}

function CatFace() {
  return (
    <svg viewBox="0 0 64 64" className="cat-face" role="presentation">
      <path d="M12 26 L10 8 L26 17 Z" />
      <path d="M52 26 L54 8 L38 17 Z" />
      <circle cx="32" cy="36" r="20" />
      <circle cx="25" cy="32" r="3" className="cat-face__eye" />
      <circle cx="39" cy="32" r="3" className="cat-face__eye" />
      <path d="M28 43 Q32 47 36 43" className="cat-face__mouth" />
    </svg>
  );
}
