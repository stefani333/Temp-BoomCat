import { Plus } from 'lucide-react';
import { COIN_BALANCE } from '../../data/homeMock';
import { CoinIcon } from '../ui/CoinIcon';

interface CoinWalletProps {
  onOpenShop: () => void;
  className?: string;
}

export function CoinWallet({ onOpenShop, className = '' }: CoinWalletProps) {
  return (
    <button
      type="button"
      onClick={onOpenShop}
      aria-label={`金币余额 ${COIN_BALANCE}，点击打开商店`}
      className={`group flex items-center gap-2 rounded-full border-2 border-[#f0b451]/60 bg-[#43271405] bg-[#432714] py-1 pl-1.5 pr-1.5 shadow-[0_5px_0_rgba(90,48,20,0.45),0_12px_20px_-10px_rgba(59,35,20,0.6)] backdrop-blur-[1px] transition hover:-translate-y-0.5 hover:border-[#ffd066] active:translate-y-0.5 active:shadow-none ${className}`}
    >
      <CoinIcon className="h-7 w-7 shrink-0 drop-shadow-[0_2px_0_rgba(120,60,10,0.5)] lg:h-8 lg:w-8" />
      <span className="flex flex-col items-start leading-none">
        <span className="text-[13px] font-black tabular-nums tracking-wide text-[#ffe9b8] lg:text-[15px]">
          {COIN_BALANCE.toLocaleString('zh-CN')}
        </span>
        <span className="text-[8px] font-bold tracking-[0.2em] text-[#d7a568] lg:text-[9px]">
          COINS
        </span>
      </span>
      <span className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#f08a2f] text-[#fff7e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition group-hover:bg-[#ff9d3d] lg:h-7 lg:w-7">
        <Plus className="h-4 w-4" strokeWidth={3} />
      </span>
    </button>
  );
}
