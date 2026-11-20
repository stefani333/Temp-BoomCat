import {
  Backpack,
  BookOpen,
  CalendarHeart,
  ClipboardList,
  Home,
  MessageCircle,
  ShoppingBag,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export type NavId =
  | 'home'
  | 'bag'
  | 'events'
  | 'shop'
  | 'quests'
  | 'rank'
  | 'messages'
  | 'rules';

export interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
  summary: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '首页', icon: Home, summary: '返回派对大厅。' },
  {
    id: 'bag',
    label: '背包',
    icon: Backpack,
    summary: '用于查看已获得的卡背、表情与道具。',
  },
  {
    id: 'events',
    label: '活动中心',
    icon: CalendarHeart,
    summary: '用于展示限时活动与福利信息。',
  },
  {
    id: 'shop',
    label: '商店',
    icon: ShoppingBag,
    summary: '用于购买外观与消耗品。',
  },
  {
    id: 'quests',
    label: '任务',
    icon: ClipboardList,
    summary: '用于查看每日任务与成长任务。',
  },
  {
    id: 'rank',
    label: '排行榜',
    icon: Trophy,
    summary: '用于展示竞技排名与赛季信息。',
  },
  {
    id: 'messages',
    label: '消息',
    icon: MessageCircle,
    summary: '用于接收系统通知与好友消息。',
  },
  {
    id: 'rules',
    label: '规则',
    icon: BookOpen,
    summary: '用于随时查阅玩法与卡牌说明。',
  },
];
