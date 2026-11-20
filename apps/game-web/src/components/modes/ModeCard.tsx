import type { CSSProperties } from 'react';
import { ChevronRight, Gamepad2, Trophy, Users } from 'lucide-react';
import type { GameMode, ModeId } from '../../data/homeMock';

const ACCENTS = {
  emerald: {
    card: 'bg-[linear-gradient(140deg,#6bdfa4_0%,#2ba86c_52%,#17824f_100%)]',
    edge: '#0f6740',
    chip: 'bg-[#0d5f3b]/35 text-[#e6fff2]',
    icon: 'border-[#eafff4]/50 bg-[#eafff4]/20 text-[#f4fff9]',
    motif: 'text-[#eafff4]',
  },
  sky: {
    card: 'bg-[linear-gradient(140deg,#74c4ff_0%,#327fd7_52%,#1d5cae_100%)]',
    edge: '#15488c',
    chip: 'bg-[#0e3f78]/40 text-[#e6f3ff]',
    icon: 'border-[#eaf6ff]/50 bg-[#eaf6ff]/20 text-[#f6fbff]',
    motif: 'text-[#e6f3ff]',
  },
  orange: {
    card: 'bg-[linear-gradient(140deg,#ffc06a_0%,#f6812f_52%,#dd561a_100%)]',
    edge: '#a83c0d',
    chip: 'bg-[#8f3108]/35 text-[#fff2e4]',
    icon: 'border-[#fff4e6]/50 bg-[#fff4e6]/20 text-[#fffaf3]',
    motif: 'text-[#fff2e4]',
  },
} as const;

const MODE_ICONS: Record<ModeId, typeof Gamepad2> = {
  casual: Gamepad2,
  ranked: Trophy,
  friends: Users,
};

interface ModeCardProps {
  mode: GameMode;
  onSelect: (mode: GameMode) => void;
}

export function ModeCard({ mode, onSelect }: ModeCardProps) {
  const accent = ACCENTS[mode.accent];
  const Icon = MODE_ICONS[mode.id];

  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-label={`进入${mode.name}，${mode.tagline}`}
      style={{ '--press-shadow': accent.edge } as CSSProperties}
      className={`press-3d group relative flex min-h-[112px] min-w-0 w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-white/40 px-2 pb-3 pt-2.5 text-center lg:min-h-0 lg:flex-none lg:flex-row lg:items-center lg:gap-3.5 lg:rounded-[26px] lg:px-4 lg:py-4 lg:text-left ${accent.card}`}
    >
      {/* 装饰层：手牌与光斑 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rotate-12 rounded-[22px] border border-white/25 bg-white/10 lg:h-24 lg:w-24"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/10"
      />
      <Icon
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-5 right-1 h-20 w-20 rotate-[-12deg] opacity-[0.13] lg:-bottom-6 lg:right-4 lg:h-24 lg:w-24 ${accent.motif}`}
        strokeWidth={1.6}
      />

      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_8px_rgba(0,0,0,0.18)] lg:h-12 lg:w-12 lg:rounded-[18px] ${accent.icon}`}
      >
        <Icon className="h-[18px] w-[18px] lg:h-6 lg:w-6" strokeWidth={2.4} />
      </span>

      <span className="relative mt-1 flex min-w-0 flex-col items-center gap-0.5 lg:mt-0 lg:flex-1 lg:items-start lg:gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[14px] font-black leading-tight tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] lg:text-[19px]">
            {mode.name}
          </span>
          <span
            className={`hidden rounded-full px-1.5 py-[1px] text-[9px] font-bold lg:inline-block ${accent.chip}`}
          >
            {mode.badge}
          </span>
        </span>
        <span className="max-w-full truncate text-[9.5px] font-semibold text-white/85 lg:text-[11.5px]">
          {mode.tagline}
        </span>
      </span>

      <span className="relative mt-1.5 flex items-center gap-1 rounded-full bg-white/15 px-2 py-[2px] text-[9px] font-bold text-white/95 lg:hidden">
        进入游戏
        <ChevronRight className="h-2.5 w-2.5" strokeWidth={3} />
      </span>

      <span className="relative hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:translate-x-0.5 group-hover:bg-white/30 lg:flex">
        <ChevronRight className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}
