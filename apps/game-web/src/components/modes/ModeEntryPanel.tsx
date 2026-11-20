import { GAME_MODES, type GameMode } from '../../data/homeMock';
import { ModeCard } from './ModeCard';

interface ModeEntryPanelProps {
  onSelectMode: (mode: GameMode) => void;
}

export function ModeEntryPanel({ onSelectMode }: ModeEntryPanelProps) {
  return (
    <div className="mode-dock">
      <div className="flex flex-col gap-2.5 lg:gap-4">
        <div className="hidden items-center justify-between rounded-2xl border-2 border-[#7a4924]/15 bg-[#fff7e6]/95 px-3.5 py-2 shadow-[0_5px_0_rgba(122,73,36,0.16)] lg:flex">
          <div>
            <p className="text-[9px] font-black tracking-[0.3em] text-[#b4804b]">PLAY NOW</p>
            <h2 className="text-[19px] font-black leading-tight text-[#4a2a16]">
              今天想怎么玩？
            </h2>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe3a8] text-[#a8641a]">
            <span className="text-[11px] font-black">3</span>
          </span>
        </div>

        <div className="flex gap-2 lg:flex-col lg:gap-4">
          {GAME_MODES.map((mode) => (
            <ModeCard key={mode.id} mode={mode} onSelect={onSelectMode} />
          ))}
        </div>

        <div className="hidden justify-center lg:flex">
          <p className="rounded-full bg-[#FFF7E6]/85 px-3 py-1 text-[10px] font-bold text-[#8A5A33] shadow-[0_2px_6px_rgba(74,42,20,0.12)]">
            模式入口为原型演示，暂未接入真实匹配
          </p>
        </div>
      </div>
    </div>
  );
}
