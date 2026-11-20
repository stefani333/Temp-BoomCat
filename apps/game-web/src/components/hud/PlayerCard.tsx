import { Star } from 'lucide-react';
import { PLAYER } from '../../data/homeMock';
import { CatAvatar } from '../ui/CatAvatar';

interface PlayerCardProps {
  onOpenProfile: () => void;
}

export function PlayerCard({ onOpenProfile }: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={onOpenProfile}
      aria-label={`查看玩家资料：${PLAYER.nickname}，等级 ${PLAYER.level}`}
      className="group flex min-w-0 items-center gap-2 rounded-2xl border-2 border-[#7a4924]/20 bg-[#fff7e6] py-2 pl-2 pr-3 text-left shadow-[0_5px_0_rgba(122,73,36,0.2),0_12px_20px_-12px_rgba(74,42,20,0.55)] transition hover:-translate-y-0.5 hover:border-[#e4772b]/40 active:translate-y-0.5 active:shadow-[0_1px_0_rgba(122,73,36,0.2)] lg:gap-3 lg:py-2.5 lg:pl-2.5 lg:pr-4"
    >
      <span className="relative shrink-0">
        <CatAvatar className="h-11 w-11 ring-2 ring-[#f4a13d] ring-offset-2 ring-offset-[#fff7e6] lg:h-12 lg:w-12" />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="max-w-[92px] truncate text-[13px] font-black tracking-tight text-[#4a2a16] lg:max-w-none lg:text-[15px]">
            {PLAYER.nickname}
          </span>
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#ffe3a8] px-1.5 py-[1px] text-[9px] font-bold text-[#9a5a13] lg:text-[10px]">
            <Star className="h-2.5 w-2.5 fill-[#f4a13d] text-[#f4a13d]" />
            Lv.{PLAYER.level}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[9px] font-semibold text-[#8a5a33] lg:text-[10px]">
          <span className="flex shrink-0 items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#37b97b] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2fa36b]" />
            </span>
            在线
          </span>
          <span className="shrink-0 text-[#c39a70]">|</span>
          <span className="truncate">ID {PLAYER.playerId}</span>
          <span className="hidden shrink-0 text-[#c39a70] lg:inline">|</span>
          <span className="hidden shrink-0 lg:inline">{PLAYER.title}</span>
        </span>
      </span>
    </button>
  );
}
