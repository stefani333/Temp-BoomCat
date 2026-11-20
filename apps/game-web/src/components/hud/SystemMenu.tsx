import { Gamepad2, MoreHorizontal, Settings } from 'lucide-react';

export type SystemActionId = 'features' | 'more' | 'settings';

const ACTIONS: Array<{
  id: SystemActionId;
  label: string;
  icon: typeof Gamepad2;
}> = [
  { id: 'features', label: '功能', icon: Gamepad2 },
  { id: 'more', label: '更多', icon: MoreHorizontal },
  { id: 'settings', label: '设置', icon: Settings },
];

interface SystemMenuProps {
  onAction: (action: SystemActionId) => void;
  className?: string;
}

export function SystemMenu({ onAction, className = '' }: SystemMenuProps) {
  return (
    <div className={`flex items-start gap-1 lg:gap-2 ${className}`}>
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction(id)}
          aria-label={`${label}入口`}
          title={`${label}（占位）`}
          className="group flex w-[42px] flex-col items-center gap-0.5 lg:w-[48px]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#7a4924]/20 bg-[#fff7e6] text-[#7a4924] shadow-[0_4px_0_rgba(122,73,36,0.22)] transition group-hover:-translate-y-0.5 group-hover:border-[#e4772b]/40 group-hover:text-[#e4772b] group-active:translate-y-0.5 group-active:shadow-none lg:h-10 lg:w-10 lg:rounded-2xl">
            <Icon className="h-[17px] w-[17px] lg:h-5 lg:w-5" strokeWidth={2.2} />
          </span>
          <span className="text-[9px] font-bold text-[#7a4924] [text-shadow:0_1px_0_rgba(255,247,230,0.8)] lg:text-[10px]">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
