# 炸弹猫咪游戏端 MVP 技术设计与运行说明

- 版本：v1.0
- 适用代码：`packages/game-core`、`apps/game-web`
- 规则依据：根目录 `炸弹猫咪_规则.md` 与 `docs/03-游戏策划/01-规则拆解与MVP功能清单.md`

## 1. 范围与目标

本设计对应游戏网页移动端（PWA）MVP：单设备本地对局，真人 1 席，其余座位由模拟玩家自动补位。目标是先把规则正确性与完整对局跑通，动画、音效与视觉包装后置。真实后端、多人联机、账号与匹配不在本期范围。

## 2. 技术选型与取舍

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 仓库形态 | pnpm workspace monorepo | AGENTS.md 默认 monorepo；本期只有 2 个包，暂不引入 Turborepo 与 Changesets，避免为空依赖增加构建复杂度 |
| 规则引擎 | 纯 TypeScript 包 `@bombcat/game-core` | 与 UI 完全分离，后续可整体迁移到 Node 服务端 |
| 前端 | React 19 + Vite 7 + TypeScript | 与团队前端首选技术栈一致；样式使用原生 CSS，不引入 Tailwind 与 Storybook |
| 测试 | Vitest | 规则、可见性、完整对局模拟 |
| 验证 | Chrome CDP 冒烟脚本 | 不引入额外浏览器依赖，直接驱动系统 Chrome |
| 端口 | 5200 | 本机 5173 被其他应用占用，固定在 5200 |

## 3. 目录结构

```text
apps/game-web
  index.html
  src/
    App.tsx              页面编排、模拟玩家推进、错误提示
    main.tsx
    styles.css
    components/CardView.tsx
    screens/
      HomeScreen.tsx      创建房间、自动演示入口
      RoomScreen.tsx      加入、准备、指定起始玩家、开始
      TableScreen.tsx     牌桌、手牌、出牌/组合、全部效果浮层
      ResultScreen.tsx    结算、日志
      DemoScreen.tsx      全模拟玩家整局演示
  scripts/ui-smoke.mjs    Chrome CDP 真实页面冒烟验证
packages/game-core
  src/
    types.ts              卡牌、状态、动作、名称与数量定义
    rng.ts                mulberry32 可复现随机
    engine.ts             规则引擎与状态机
    view.ts               按玩家裁剪的视图
    bots.ts               模拟玩家策略
    simulation.ts         无界面整局模拟
    __tests__/rules.test.ts
```

## 4. 分层与数据流

```text
用户操作 / 模拟玩家策略
        ↓ GameAction
GameEngine.apply(action)   ← 服务端权威语义，校验、结算、写日志
        ↓ GameState
getGameView(state, playerId) ← 可见性裁剪
        ↓ GameView
React 页面渲染
```

- 所有随机结果（洗牌、抽牌、随机抽取手牌、炸弹放回、模拟玩家决策）由引擎内的随机状态生成。
- 页面只调用 `apply` 提交操作，不直接修改状态，不判断胜负。
- 模拟玩家与真人使用同一套动作接口和校验路径。

## 5. 规则引擎

### 5.1 状态

`GameState` 包含 `players`、`drawPile`、`discardPile`、`removedPile`、`currentPlayerId`、`turnsRemaining`、`turnNumber`、`cardsPlayedThisTurn`、`pending`、`winnerPlayerId`、`eventLog`、`rngState` 等字段，对应规则 8.1 的建议状态。`pending` 统一表达反制窗口、恩惠交牌、预见未来确认、炸弹决策与放回位置。

### 5.2 动作

| 规则建议动作 | 实现动作 | 说明 |
| --- | --- | --- |
| PLAY_CARD | `PLAY_CARD` | 单张与猫咪组合共用，组合由卡牌构成推断 |
| PLAY_COMBINATION | `PLAY_CARD` | 见上 |
| DRAW_CARD | `DRAW_CARD` | 抽牌并结束一个回合，炸弹转入 `pending` |
| DEFUSE_BOMB | `RESOLVE_BOMB` | 使用或放弃拆除 |
| INSERT_BOMB | `CHOOSE_BOMB_INSERT` | 顶部、底部或指定下标 |
| SELECT_TARGET | 随 `PLAY_CARD` 提交 | 简化交互轮次 |
| GIVE_CARD | `CHOOSE_FAVOR_CARD` | 由恩惠目标选择 |
| SELECT_CARD_NAME | 随 `PLAY_CARD` 提交 | 三张相同猫咪 |
| SELECT_DISCARD_CARD | 随 `PLAY_CARD` 提交 | 五张不同猫咪 |
| COUNTER_ACTION / PASS_COUNTER | `RESPOND_COUNTER` | 同一动作携带布尔值 |
| VIEW_FUTURE | 结算时生成，`ACK_SEE_FUTURE` 确认 | 三张牌不离开牌堆 |
| SHUFFLE_PILE | 随 `PLAY_CARD` 结算 | 不与规则语义冲突 |

另有房间动作：`JOIN_ROOM`、`SET_READY`、`SET_START_PLAYER`、`START_GAME`。

### 5.3 回合与攻击

- 回合结束统一走 `advanceTurn`：`turnsRemaining` 减 1，大于 0 时同一玩家进入下一回合，否则按座位找下一位存活玩家。
- 攻击结算走 `transferAttack`：当前玩家立即结束，下一位存活玩家 `turnsRemaining` 直接置为 2，不叠加当前剩余回合。
- 攻击、跳过、拆除与普通抽牌都只消耗一个回合；洗混、预见未来、猫咪组合不结束回合。
- 淘汰玩家时跳过其剩余回合，下一位存活玩家从 1 个回合开始。

### 5.4 反制链

- 打出的卡牌或组合进入 `pending` 后按座位顺序询问持有休想的存活玩家。
- 每次休想入链后，重新从该玩家之后构建询问队列，允许此前放弃的玩家再次反制。
- 队列清空后结算：反制层数为奇数则原效果作废，偶数则原效果生效。
- 炸弹猫、拆除、抽牌不进入反制窗口，符合规则 5.2 与 12.2。

### 5.5 可见性

`getGameView` 只输出：本人手牌明细、他人手牌数量、抽牌堆数量、弃牌堆明细、存活状态、公开事件；预见未来的三张牌只在 `pending.sourcePlayerId === viewerId` 时下发；炸弹放回位置不写入任何事件日志。

### 5.6 随机与复现

使用 mulberry32 伪随机，随机状态保存在 `GameState.rngState`。相同种子与相同操作序列产生相同对局，测试中已有断言。

### 5.7 模拟玩家

`nextBotStep(state)` 只读取自己的手牌与公开信息，按固定优先级选择出牌或抽牌；目标选择、恩惠交牌、炸弹处理与反制均有对应策略。模拟玩家动作同样经过 `apply` 校验，不绕过规则。

## 6. 前端行为

- `App.tsx` 每 620ms 推进一步模拟玩家动作，在真人回合或真人需要响应的浮层处停止。
- 牌桌中的浮层覆盖：反制、恩惠交牌、炸弹决策、炸弹放回、预见未来、目标选择、卡名选择、弃牌选择。
- 用户操作被拒绝时以底部提示条展示引擎返回的错误，不静默失败。
- 「自动演示一局」在 `DemoScreen` 中直接运行 `runFullSimulation`，用于快速验收。

## 7. 运行与验证

环境要求：Node.js 20 以上（实测 24.12）、pnpm 11。

```bash
pnpm install
pnpm dev                 # 启动游戏端，http://localhost:5200/
pnpm test                # 规则引擎测试
pnpm build               # 类型检查与生产构建
pnpm --filter @bombcat/game-web ui:smoke   # 需先启动 pnpm dev，使用系统 Chrome
```

`ui:smoke` 可用 `CHROME_PATH` 覆盖 Chrome 可执行文件路径，用 `APP_URL` 覆盖页面地址，用 `CDP_PORT` 覆盖调试端口。

## 8. 已知限制与后续

1. 当前为单设备本地对局，引擎运行在浏览器内。可见性裁剪已在视图层实现，但真正的服务端权威需要把 `game-core` 迁移到 Node 服务。
2. 房间层规则（真人联机、解散投票、断线重连、房主转移）未实现，不属于本期验收范围。
3. 未实现动画、音效与 PWA 安装清单。
4. 规则未明确的边界统一登记在测试报告问题清单，不自行补规则。
