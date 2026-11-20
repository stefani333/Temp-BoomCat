import { ArrowLeft, Info } from 'lucide-react';
import type { NavItem } from '../navigation/navItems';

interface SectionPlaceholderProps {
  item: NavItem;
  onBackHome: () => void;
}

/** 底部导航其余入口的临时占位页，明确标注尚未实现。 */
export function SectionPlaceholder({ item, onBackHome }: SectionPlaceholderProps) {
  const Icon = item.icon;

  return (
    <section
      aria-label={`${item.label}占位页`}
      className="absolute inset-0 z-[35] flex items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#FBE3B6_0%,#F4CD8F_55%,#E8B274_100%)] px-4 pb-28 pt-16 lg:pb-32"
    >
      <button
        type="button"
        onClick={onBackHome}
        className="absolute left-3 top-4 flex items-center gap-1.5 rounded-full border-2 border-[#7A4924]/20 bg-[#FFF7E6] py-2 pl-2.5 pr-3.5 text-[12px] font-black text-[#7A4924] shadow-[0_4px_0_rgba(122,73,36,0.2)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none lg:left-6 lg:top-6"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.8} />
        返回首页
      </button>

      <div className="w-full max-w-md rounded-[28px] border-4 border-[#7A4924] bg-[#FFF7E6] p-6 text-center shadow-[0_18px_40px_rgba(74,42,20,0.3)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border-2 border-[#7A4924]/15 bg-[linear-gradient(180deg,#FFE3A8,#F6C575)] text-[#8A4A22] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),0_6px_0_rgba(122,73,36,0.15)]">
          <Icon className="h-9 w-9" strokeWidth={2} />
        </div>

        <p className="mt-4 inline-block rounded-full bg-[#FFE3A8] px-2.5 py-1 text-[10px] font-black tracking-wide text-[#9A5A13]">
          占位页面 · 尚未实现
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#4A2A16]">
          {item.label}
        </h2>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#7A5433]">
          {item.summary}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-dashed border-[#D9A868] bg-[#FFF3DC] px-3 py-2.5 text-left">
          <Info className="mt-[2px] h-4 w-4 shrink-0 text-[#B4804B]" strokeWidth={2.4} />
          <p className="text-[11px] font-semibold leading-relaxed text-[#9A7448]">
            本次原型只交付游戏首页，底部导航仅用于演示选中态与页面切换。该模块没有真实数据与业务逻辑。
          </p>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="press-3d mt-4 w-full rounded-2xl border-2 border-white/40 bg-[linear-gradient(180deg,#FFC45C,#F08A2F)] py-3 text-[15px] font-black text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ '--press-shadow': '#A9540F' } as React.CSSProperties}
        >
          回到派对大厅
        </button>
      </div>
    </section>
  );
}
