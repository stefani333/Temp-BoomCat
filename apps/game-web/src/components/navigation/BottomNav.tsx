import { NAV_ITEMS, type NavId } from './navItems';

interface BottomNavProps {
  activeId: NavId;
  onSelect: (id: NavId) => void;
}

export function BottomNav({ activeId, onSelect }: BottomNavProps) {
  return (
    <nav
      aria-label="主导航"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-2 pb-[max(8px,env(safe-area-inset-bottom))] lg:px-6 lg:pb-4"
    >
      <div className="pointer-events-auto mx-auto flex max-w-4xl items-stretch gap-0.5 rounded-[22px] border-2 border-[#f7c879]/25 bg-[#3b2314] p-1.5 shadow-[0_14px_30px_rgba(59,35,20,0.45),inset_0_1px_0_rgba(255,217,150,0.22)] lg:gap-1 lg:rounded-[26px] lg:p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[16px] px-0.5 py-1.5 transition lg:gap-1 lg:rounded-[18px] lg:py-2 ${
                active
                  ? 'bg-[linear-gradient(180deg,#ffcf6b_0%,#f08a2f_100%)] text-[#3b2314] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_4px_0_#a9540f]'
                  : 'text-[#f7dfb8]/65 hover:bg-white/[0.06] hover:text-[#ffe9c4]'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:-translate-y-[1px] lg:h-5 lg:w-5 ${
                  active ? 'scale-110' : ''
                }`}
                strokeWidth={active ? 2.6 : 2}
              />
              <span
                className={`max-w-full whitespace-nowrap text-[10px] font-bold leading-none tracking-tight max-[380px]:text-[8.5px] max-[380px]:tracking-[-0.04em] lg:text-[11px] ${
                  active ? '' : 'opacity-90'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
