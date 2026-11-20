import { useCallback, useState } from 'react';
import { COIN_BALANCE, PLAYER, type GameMode } from './data/homeMock';
import { LobbyScene } from './components/lobby/LobbyScene';
import { CatCharacter } from './components/lobby/CatCharacter';
import { PlayerCard } from './components/hud/PlayerCard';
import { CoinWallet } from './components/hud/CoinWallet';
import { SystemMenu, type SystemActionId } from './components/hud/SystemMenu';
import { ModeEntryPanel } from './components/modes/ModeEntryPanel';
import { BottomNav } from './components/navigation/BottomNav';
import { NAV_ITEMS, type NavId } from './components/navigation/navItems';
import { GameDialog, type DialogContent } from './components/overlays/GameDialog';
import { SectionPlaceholder } from './components/overlays/SectionPlaceholder';

const SYSTEM_DIALOGS: Record<SystemActionId, DialogContent> = {
  features: {
    eyebrow: '系统功能 · 占位',
    title: '游戏功能',
    description:
      '该入口用于承载游戏内的扩展功能。本次原型只演示按钮点击反馈，暂未提供任何可用功能。',
    accent: 'amber',
  },
  more: {
    eyebrow: '更多菜单 · 占位',
    title: '更多',
    description:
      '正式产品会在这里提供帮助、问题反馈与关于信息。本次原型未开发对应页面。',
    accent: 'amber',
  },
  settings: {
    eyebrow: '设置入口 · 占位',
    title: '设置',
    description:
      '正式产品会在这里提供音效、音乐、画质与账号相关设置。本次原型未实现真实设置项，点击后不会改变任何状态。',
    accent: 'amber',
  },
};

const PROFILE_DIALOG: DialogContent = {
  eyebrow: '玩家资料 · 模拟数据',
  title: PLAYER.nickname,
  description:
    '当前身份体系尚未接入，头像、昵称、等级与在线状态均为静态模拟数据，刷新页面不会保存任何改动。',
  points: [
    `玩家 ID：${PLAYER.playerId}`,
    `当前等级：Lv.${PLAYER.level} · ${PLAYER.title}`,
    '登录、账号绑定与资料编辑未开发',
  ],
  accent: 'amber',
};

const COIN_DIALOG: DialogContent = {
  eyebrow: '商店入口 · 占位',
  title: '金币商店',
  description: `当前模拟余额为 ${COIN_BALANCE.toLocaleString('zh-CN')} 金币。点击金币进入商店是正式产品的入口设计，本次原型没有商品、充值或兑换能力。`,
  points: ['金币数量为模拟数据', '商店商品与经济系统未开发', '点击不会扣款或产生订单'],
  accent: 'amber',
};

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>('home');
  const [dialog, setDialog] = useState<DialogContent | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);

  const handleNavSelect = (id: NavId) => {
    setDialog(null);
    setActiveNav(id);
  };

  const handleModeSelect = (mode: GameMode) => {
    setDialog({
      eyebrow: '模式介绍 · 占位页',
      title: mode.name,
      description: mode.description,
      points: mode.highlights,
      accent: mode.accent,
      confirmLabel: '返回大厅',
    });
  };

  const activeNavItem =
    NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0];

  return (
    <div className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#F4CF92] text-[#4A2A16]">
      <LobbyScene />

      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3 pt-3 lg:px-6 lg:pt-5">
        <PlayerCard onOpenProfile={() => setDialog(PROFILE_DIALOG)} />

        <div className="flex flex-col items-end gap-2 lg:hidden">
          <CoinWallet onOpenShop={() => setDialog(COIN_DIALOG)} />
          <SystemMenu onAction={(action) => setDialog(SYSTEM_DIALOGS[action])} />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 lg:block">
          <CoinWallet
            className="pointer-events-auto"
            onOpenShop={() => setDialog(COIN_DIALOG)}
          />
        </div>

        <SystemMenu
          className="hidden lg:flex"
          onAction={(action) => setDialog(SYSTEM_DIALOGS[action])}
        />
      </header>

      {activeNav === 'home' ? (
        <>
          <div className="lobby-cat-stage">
            <CatCharacter />
          </div>

          <ModeEntryPanel onSelectMode={handleModeSelect} />

          <div className="pointer-events-none absolute bottom-[92px] left-6 z-20 hidden items-center gap-2 rounded-full border border-[#7A4924]/15 bg-[#FFF7E6]/85 px-3 py-1.5 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2FA36B]" />
            <span className="text-[10px] font-bold tracking-wide text-[#8A5A33]">
              原型演示 · 角色与数值均为模拟
            </span>
          </div>
        </>
      ) : (
        <SectionPlaceholder
          item={activeNavItem}
          onBackHome={() => handleNavSelect('home')}
        />
      )}

      <BottomNav activeId={activeNav} onSelect={handleNavSelect} />

      <GameDialog content={dialog} onClose={closeDialog} />
    </div>
  );
}
