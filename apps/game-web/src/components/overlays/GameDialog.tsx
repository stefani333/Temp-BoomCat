import { useEffect, useId, useRef } from 'react';
import {
  Check,
  Gamepad2,
  Info,
  Sparkles,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

export type DialogAccent = 'amber' | 'emerald' | 'sky' | 'orange';

export interface DialogContent {
  eyebrow: string;
  title: string;
  description: string;
  points?: string[];
  accent: DialogAccent;
  confirmLabel?: string;
}

const ACCENTS: Record<
  DialogAccent,
  { icon: LucideIcon; iconBox: string; chip: string; button: string; edge: string }
> = {
  amber: {
    icon: Sparkles,
    iconBox: 'bg-[#FFE3A8] text-[#A8641A]',
    chip: 'bg-[#FFF0D0] text-[#9A5A13]',
    button: 'bg-[linear-gradient(180deg,#FFC45C,#F08A2F)]',
    edge: '#A9540F',
  },
  emerald: {
    icon: Gamepad2,
    iconBox: 'bg-[#D4F5E2] text-[#17824F]',
    chip: 'bg-[#E6FBF0] text-[#17824F]',
    button: 'bg-[linear-gradient(180deg,#6BDFA4,#24A268)]',
    edge: '#0F6740',
  },
  sky: {
    icon: Trophy,
    iconBox: 'bg-[#D9EEFF] text-[#1D5CAE]',
    chip: 'bg-[#EAF5FF] text-[#1D5CAE]',
    button: 'bg-[linear-gradient(180deg,#74C4FF,#2F7AD6)]',
    edge: '#15488C',
  },
  orange: {
    icon: Users,
    iconBox: 'bg-[#FFE4CC] text-[#C24E11]',
    chip: 'bg-[#FFF0E2] text-[#C24E11]',
    button: 'bg-[linear-gradient(180deg,#FFC06A,#F0782B)]',
    edge: '#A83C0D',
  },
};

interface GameDialogProps {
  content: DialogContent | null;
  onClose: () => void;
}

export function GameDialog({ content, onClose }: GameDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = content !== null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!content) return null;

  const accent = ACCENTS[content.accent];
  const Icon = accent.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="关闭弹窗"
        onClick={onClose}
        className="dialog-backdrop absolute inset-0 cursor-default bg-[#2A160C]/65"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog-panel relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[26px] border-4 border-[#5B3218] bg-[#FFF6E3] p-5 shadow-[0_26px_60px_rgba(42,22,12,0.45)] sm:rounded-[30px] sm:p-6"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#EFD9B6] text-[#6B3A1C] transition hover:bg-[#E4C79D] active:scale-95"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.6} />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#5B3218]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${accent.iconBox}`}
          >
            <Icon className="h-6 w-6" strokeWidth={2.3} />
          </span>
          <div className="min-w-0">
            <p className={`inline-block rounded-full px-2 py-[3px] text-[9px] font-black tracking-wide ${accent.chip}`}>
              {content.eyebrow}
            </p>
            <h2
              id={titleId}
              className="mt-1 text-xl font-black leading-tight tracking-tight text-[#4A2A16] sm:text-[22px]"
            >
              {content.title}
            </h2>
          </div>
        </div>

        <p className="mt-3.5 text-[13px] font-medium leading-relaxed text-[#6B4A2E]">
          {content.description}
        </p>

        {content.points && content.points.length > 0 && (
          <ul className="mt-3.5 flex flex-col gap-2 rounded-2xl bg-[#FBEBCF] p-3">
            {content.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-[12px] font-semibold leading-snug text-[#7A5433]">
                <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F4A13D] text-[#FFF6E3]">
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3.5 flex items-start gap-2 rounded-2xl border-2 border-dashed border-[#D9A868] bg-[#FFFAF0] px-3 py-2.5">
          <Info className="mt-[1px] h-4 w-4 shrink-0 text-[#B4804B]" strokeWidth={2.4} />
          <p className="text-[11px] font-semibold leading-relaxed text-[#9A7448]">
            占位功能：本次交付只完成首页原型，该入口未接入真实系统、匹配、房间或个人资料业务，也不会产生任何数据。
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ '--press-shadow': accent.edge } as React.CSSProperties}
          className={`press-3d mt-4 w-full rounded-2xl border-2 border-white/40 py-3 text-[15px] font-black tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] ${accent.button}`}
        >
          {content.confirmLabel ?? '知道了，返回大厅'}
        </button>

        <p className="mt-2.5 text-center text-[9px] font-bold tracking-[0.2em] text-[#BFA078]">
          PROTOTYPE · 模拟数据
        </p>
      </div>
    </div>
  );
}
