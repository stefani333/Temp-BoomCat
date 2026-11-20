export type ModeId = 'casual' | 'ranked' | 'friends';

export interface PlayerProfile {
  nickname: string;
  playerId: string;
  level: number;
  title: string;
  online: boolean;
}

export const PLAYER: PlayerProfile = {
  nickname: '爆米花船长',
  playerId: 'BC-2048371',
  level: 12,
  title: '派对新星',
  online: true,
};

export const COIN_BALANCE = 12800;

export interface GameMode {
  id: ModeId;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  highlights: string[];
  accent: 'emerald' | 'sky' | 'orange';
}

export const GAME_MODES: GameMode[] = [
  {
    id: 'casual',
    name: '休闲模式',
    tagline: '随开随玩，输赢都开心',
    badge: '轻松',
    description:
      '适合想熟悉规则、或随手来一局的玩家。正式版本会在这里进入休闲对局，匹配或 AI 对手由系统安排。',
    highlights: [
      '适合新手熟悉卡牌与回合流程',
      '单局时长短，随时可以停下',
      '对局结果不计入竞技段位',
    ],
    accent: 'emerald',
  },
  {
    id: 'ranked',
    name: '段位挑战',
    tagline: '一路升段，证明猫力',
    badge: '竞技',
    description:
      '面向喜欢对抗与成长的玩家。正式版本会在这里进入排位对局，记录战绩并展示当前段位。',
    highlights: [
      '与实力相近的对手对局（规划中）',
      '段位与战绩展示（规划中）',
      '竞技规则与休闲模式保持一致',
    ],
    accent: 'sky',
  },
  {
    id: 'friends',
    name: '亲友房',
    tagline: '喊上朋友，围桌开局',
    badge: '开房',
    description:
      '适合聚会与熟人组局。正式版本会在这里创建房间，把房间号或邀请链接发给朋友即可加入。',
    highlights: [
      '创建房间并生成邀请链接',
      '凭房间号加入，不需要先加好友',
      '人数范围以现有规则为准',
    ],
    accent: 'orange',
  },
];

export const MODES_BY_ID = Object.fromEntries(
  GAME_MODES.map((mode) => [mode.id, mode]),
) as Record<ModeId, GameMode>;
