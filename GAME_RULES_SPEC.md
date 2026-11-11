# 爆炸猫咪（Exploding Kittens）网页移动端版 · 游戏规则规格

> **文档用途**：作为 AI 开发 agent 的**唯一规则真源（single source of truth）**。实现时不得引入本文档之外的规则；所有官方说明书未覆盖或中文圈存在分歧的点，已在第 2 节固定为默认值或显式开关。
> **版本**：v1.1 / 2026-11-11（v1.1 修订：牌库守恒不变量与「抽空」分支，见 9.1 与第 10 节；修正 v1.0 的 `reshuffleDiscard` 错误兜底）
> **范围**：官方基础版（不含扩展），2–5 人，默认单机「1 真人 + AI 对手」，纯前端、无后端。
> **规则来源**：官方说明书（UltraBoardGames 转录版）、官方组合牌说明、《Streaking Kittens》扩展说明书、小红书笔记《超简单！爆炸猫咪卡牌完整规则》以及中文桌游资料交叉核对。

---

## 0. 可直接复制给 agent 的启动指令

```
请实现一个竖屏移动端网页版《爆炸猫咪》卡牌游戏：单页、纯前端、无后端、无账号、触屏操作。
规则以 GAME_RULES_SPEC.md 为唯一真源，实现时重点遵守：

1. 基础版共 56 张牌。开局每人 4 张 + 1 张拆除卡；牌库中爆炸猫 = 玩家数 − 1；多余的拆除卡必须放回牌库。
2. 回合的结束方式是「抽 1 张牌」，而不是「出牌后结束」；跳过卡 / 攻击卡可免抽。
3. 用两个模型统一所有时序：
   - pendingTurns（该玩家还需连续执行的回合数）
   - 休想响应栈（奇数张休想 = 行动被抵消，偶数张 = 生效）
   详见第 5、6 节，不要用散落的 if-else 去猜。
4. 抽到爆炸猫：有拆除卡则秘密插回牌库任意位置并结束当前这 1 个回合；无拆除卡则弃光全部手牌出局。
5. 休想卡不能作用于爆炸猫与拆除卡。
6. 攻击卡采用 official 模式（转嫁，不累加），见第 2 节开关。
7. 所有秘密信息（手牌内容、先知看到的顶 3 张、拆弹插入位置）不得泄露给其他玩家。
8. 状态结算与动画播放分离；随机数用可注入 seed，便于复现测试。
9. 牌库只减不增，必须断言「存活人数 === 1 + 牌库内爆炸猫数」这条守恒关系；牌库为空是必须实现的一等终局分支，绝不允许把弃牌堆里的爆炸猫洗回牌库。详见 9.1 与第 10 节。

请按顺序交付：数据模型 → 状态机 → 卡牌效果 → AI 策略 → UI；最后逐条跑通第 12 节的验收用例。
```

---

## 1. 目标与非目标

| 项 | 内容 |
|---|---|
| 目标平台 | 移动端浏览器，竖屏优先，最小 375×667，触屏；桌面浏览器兼容即可 |
| 目标模式 | 单人对 AI（默认）；本地同屏轮流传手机 pass-and-play（可选） |
| 单局时长 | 5–15 分钟 |
| 非目标 | 扩展包（内爆猫、裸奔猫、狂吠猫等）、在线多人 / 房间 / 服务器权威、账号、内购、动画剧情、Netflix 版独占卡 |
| 存档 | 可选 localStorage，刷新后恢复当前局 |

---

## 2. 决策与开关（默认值已定，可直接开工）

所有开关集中在一个 `RuleConfig` 对象里，禁止散落在业务代码中。

| key | 默认值 | 可选值 | 说明 |
|---|---|---|---|
| `attackStackMode` | `official` | `official` / `stacked` | **官方**：被攻击者若自己再打攻击卡，其剩余回合立即全部取消，由再下一位玩家承担 2 个回合（是「转嫁」，不累加）。**stacked**（中文圈常见村规）：同一玩家一个回合内连打 k 张攻击卡，下家需连续进行 `1 + k` 个回合。笔记里说的「无限叠加」属于村规，不是官方规则。 |
| `comboScope` | `catCardsOnly` | `catCardsOnly` / `anyMatchingIcon` | 原版组合牌只能用无技能猫咪牌；新版 / 扩展放宽到任意角落图标相同的卡。 |
| `deckEmptyPolicy` | `endGame` | `endGame` / `reshuffleNoKittens` / `error` | **抽牌时牌库为空是一等分支，必须实现**。`endGame`（默认）：立即按第 10 节 tie-breaker 判定胜负并结束。`reshuffleNoKittens`：只把弃牌堆中的**非爆炸猫**洗回牌库继续（牌库可循环续命，必须配合 `maxTurns`）。`error`：抛断言异常，仅用于开发/测试环境。**禁止把爆炸猫洗回牌库**，会让 `存活人数 = 1 + k` 的守恒失效、游戏永不结束。 |
| `kittenFromDiscard` | `forbidden` | `forbidden` / `allowed` | 「5 张不同花色」能否从弃牌堆捞取 `exploding_kitten`。默认禁止：官方《Streaking Kittens》扩展明确写道 "Exploding Kittens ... nor can you remove either of them from the Discard Pile. **Why? Because it breaks the game.**"，基础版数字实现沿用该设计意图。 |
| `invariantCheck` | `true` | 布尔 | 每次 `TURN_END` 校验 `存活人数 === 1 + k`（k = 牌库内爆炸猫数），不成立则写 warning 日志（含 seed / 回合数 / 各堆张数），不阻断游戏。 |
| `maxTurns` | `200` | 数值 | 防僵局上限：累计回合数达到该值时强制按第 10 节判定胜负。 |
| `nopeWindowTimeoutMs` | `5000` | 数值 | 真人响应窗口倒计时；AI 一律立即 pass。 |
| `playerMode` | `singlePlayerAI` | `singlePlayerAI` / `localPassAndPlay` | 后者必须实现交接屏（见 11.2）。 |
| `defusePlacement` | `anyIndex` | `anyIndex` / `topOnly` | 拆弹后爆炸猫可插入牌库 `0..length` 任意位置；`topOnly` 为简化新手模式。 |
| `allowDeclineDefuse` | `false` | 布尔 | 抽到爆炸猫且持有拆除卡时是否允许玩家主动放弃保命。默认强制使用。 |

---

## 3. 数据模型

```ts
type CardKind =
  | 'exploding_kitten' | 'defuse' | 'nope' | 'attack' | 'skip'
  | 'favor' | 'see_future' | 'shuffle' | 'cat';

type CatIcon = 'A' | 'B' | 'C' | 'D' | 'E'; // 5 种花色，仅作配对标识，名称/美术请自定义

interface Card {
  id: string;              // 全局唯一
  kind: CardKind;
  icon?: CatIcon;          // 仅 kind === 'cat' 时有值
}

interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];            // 内容保密
  alive: boolean;
  pendingTurns: number;    // 还需连续执行的回合数；0 表示轮到下一位
}

type Phase =
  | 'SETUP' | 'TURN_START' | 'ACTION' | 'RESPONSE_WINDOW'
  | 'RESOLVE' | 'DRAW' | 'EXPLODE_CHECK' | 'DEFUSE_WINDOW'
  | 'TURN_END' | 'GAME_OVER';

interface GameState {
  players: Player[];             // 固定座次，出局者 alive=false 但不从数组移除
  drawPile: Card[];              // index 0 = 牌库顶
  discardPile: Card[];           // 内容公开，可被 5 张不同花检索
  currentPlayerIndex: number;
  direction: 1;                  // 固定顺时针
  phase: Phase;
  activeAction: PendingAction | null;  // 正在响应窗口中的行动
  nopeStack: Card[];
  rngSeed: number;
  turnCount: number;             // 累计回合数，用于 maxTurns 防僵局
  log: GameEvent[];              // 只记录公开事件，秘密信息不入日志
  config: RuleConfig;
}
```

**`pendingTurns` 语义（关键）**：进入某玩家回合时若其值 `<= 0` 则置为 `1`；每完成一个回合（无论是抽牌结束、跳过、拆弹、出局）都减 `1`；归零后切换到下一位存活玩家。攻击卡是唯一会把当前玩家 `pendingTurns` 直接清零的卡。

---

## 4. 常量与开局流程

### 4.1 牌组构成（基础版共 56 张）

```json
{
  "exploding_kitten": 4,
  "defuse": 6,
  "nope": 5,
  "attack": 4,
  "skip": 4,
  "favor": 4,
  "see_future": 5,
  "shuffle": 4,
  "cat": 20
}
```

`cat` 为 5 种花色各 4 张，合计 20 张。校验：`4+6+5+4+4+4+5+4+20 = 56`。

### 4.2 开局步骤（顺序不可交换）

1. 从 56 张中挑出全部 `exploding_kitten`(4) 和 `defuse`(6)，放到一边。
2. 剩余 46 张洗匀，发给每位玩家 4 张。
3. 再给每位玩家 1 张 `defuse`，此时每人手牌 5 张。
4. 取 `N − 1` 张 `exploding_kitten` 放回牌库（N = 玩家数，2–5）；多余的爆炸猫**移出本局**，不使用。
5. **把剩余的 `6 − N` 张 `defuse` 也放回牌库**（极易漏 implement，直接决定后期还有没有保命牌）。
6. 洗匀牌库，牌面朝下置于中央；弃牌堆为空。
7. 随机或按约定选起始玩家，`phase = TURN_START`。

**开局不变量**：牌库初始张数 = `46 − 4N + (N−1) + (6−N)` = `51 − 4N`（N=5 → 31 张，N=2 → 43 张）；牌库中爆炸猫 `k = N−1`，直到有人抽到它并出局才减少 1 张（拆弹插回后 k 不变）。完整守恒推导见 9.1。

---

## 5. 回合状态机与主循环

| 状态 | 进入条件 | 行为 | 去向 |
|---|---|---|---|
| `TURN_START` | 轮到某存活玩家 | 若 `pendingTurns <= 0` 置 1；清空临时标记 | `ACTION` |
| `ACTION` | 玩家可操作 | 出任意张功能牌 / 组合牌，或选择「结束回合并抽牌」 | 出牌 → `RESPONSE_WINDOW`；结束回合 → `DRAW` |
| `RESPONSE_WINDOW` | 有一个待结算行动 | 收集休想卡（见第 6 节） | `RESOLVE` |
| `RESOLVE` | 窗口关闭 | 若被抵消：卡进弃牌堆、无效果、回到 `ACTION`；否则执行效果 | `ACTION` 或 `TURN_END` |
| `DRAW` | 正常结束回合 | 从牌库顶抽 1 张；牌库空则走 9.1 抽空分支 | `EXPLODE_CHECK` / `GAME_OVER` |
| `EXPLODE_CHECK` | 抽牌后 | 非爆炸猫 → 入手牌；爆炸猫 → 检查是否持有 `defuse` | `DEFUSE_WINDOW` / `TURN_END` / `GAME_OVER` |
| `DEFUSE_WINDOW` | 抽到爆炸猫且有拆除卡 | **不开休想窗口**；选择插入位置 | `TURN_END` |
| `TURN_END` | 回合结束 | `pendingTurns -= 1`；执行不变量断言；判定胜负 | `TURN_START` / `GAME_OVER` |

### 5.1 主循环伪代码

```
function runTurn(p):
  phase = ACTION
  while true:
    action = await waitForAction(p)          // 出牌 / 组合 / 结束回合
    if action == END_TURN: break             // 走正常抽牌

    result = openResponseWindow(action)
    if result == CANCELLED:
      discard(action.cards)                 // 被抵消的卡照样进弃牌堆
      continue                             // 回合继续，可以再出牌

    applyEffect(action)                     // 见第 7 节
    discard(action.cards)
    if action.endsTurnWithoutDraw:
      if action.kind == 'skip':  p.pendingTurns -= 1
      if action.kind == 'attack': p.pendingTurns = 0
      return finishTurn(p, drewCard = false)

  card = drawOne(p)                         // 牌库空时走 9.1 抽空分支，可能直接 GAME_OVER
  resolveDraw(p, card)                     // 见第 9 节
  p.pendingTurns -= 1
  finishTurn(p, drewCard = true)
```

`finishTurn` 先检查存活人数，再按顺时针找下一位 `alive` 玩家；若其 `pendingTurns > 0`（被攻击累积），则继续由他行动，不重置为 1。

---

## 6. 休想卡响应窗口（最容易实现错的地方）

1. **触发范围**：任意功能牌、任意组合牌，都是「一次行动」，各开一个窗口。
2. **两个例外**：`exploding_kitten` 被抽到、`defuse` 被打出，**不开启响应窗口**，休想卡绝对不能作用于这两者。
3. **谁能响应**：所有存活玩家，包括行动发起者本人以外的任意人，也可以在别人的回合打出。
4. **询问顺序**：从行动发起者的下一位开始顺时针逐个询问，每人选择 `pass` 或打出 1 张 `nope`；第一个打出 `nope` 的人结束本轮，随后**重新开启新一轮询问**（因为这张休想本身可被反休想）。轮到 AI 时立即 pass；真人超时视为 pass。
5. **窗口关闭条件**：某一轮**所有存活玩家都 pass**（且没人再打休想）。
6. **结算**：`nopeStack.length` 为奇数 → 行动被抵消；为偶数（含 0）→ 行动生效。所有打出的休想卡都进弃牌堆。
7. **被抵消的后果**：该行动的卡全部进弃牌堆、效果不生效、**不结束回合**，发起者仍处在 `ACTION` 阶段可继续出牌或改为抽牌。
8. **实现约束**：`nope` 卡不允许「空打」，只能作为响应窗口中的响应牌打出。
9. **组合牌**：无论打出 2 / 3 / 5 张，都算一次行动，1 张休想可整体抵消。

---

## 7. 卡牌效果（逐条精确定义）

| 卡 | 阶段 | 效果 | 是否结束回合 / 是否免抽 |
|---|---|---|---|
| `skip` 跳过 | `ACTION` | 立即结束当前回合，不抽牌；`p.pendingTurns -= 1` | 是 / 免抽 |
| `attack` 攻击 | `ACTION` | 立即结束当前玩家**所有剩余回合**（`p.pendingTurns = 0`），给下一位存活玩家 `pendingTurns += bonus`；`bonus = official ? 2 : 1 + k`，k 为本回合该玩家连续打出的攻击卡总数（含本次） | 是 / 免抽 |
| `favor` 恩惠 | `ACTION` | 指定一名存活对手，对方**自行选择**其手牌中的 1 张交给你；对方手牌为空则无效果 | 否 |
| `see_future` 先知 | `ACTION` | 查看 `drawPile` 顶部最多 3 张（不足 3 张则看全部），**按原顺序放回**，不得展示给其他玩家 | 否 |
| `shuffle` 洗牌 | `ACTION` | 用 seeded RNG 洗乱 `drawPile`，牌数不变，不得查看牌面 | 否 |
| `nope` 休想 | `RESPONSE_WINDOW` | 抵消一次行动，见第 6 节 | 不适用 |
| `defuse` 拆除 | `DEFUSE_WINDOW` | 被动触发，见 9.2 | 消耗 1 个回合 |
| `cat` 猫咪牌 | `ACTION` | 单张无效，仅作组合牌素材 | 否 |
| `exploding_kitten` | `DRAW` | 抽到即处理，见 9.2 / 9.3；**永远不能主动打出** | 视结果 |

**注意**：出牌数量无上限，手牌数量无上限也无下限；手牌为空时不做任何特殊处理，下一回合照常抽牌即可。回合中打出的牌一律进入**弃牌堆**，弃牌堆内容对所有玩家公开可查（这是「5 张不同花」能选牌的前提；部分中文民间规则写的「面朝下弃牌」与官方描述不符，数字版采用官方口径）。

---

## 8. 组合牌

判定依据为 `comboScope`：默认 `catCardsOnly`（仅 5 种猫咪牌），可选 `anyMatchingIcon`（任意角落图标相同的卡）。

| 组合 | 判定 | 效果 |
|---|---|---|
| 2 张同花色 | 2 张卡的花色相同 | 指定一名存活对手，用 seeded RNG 从其手牌中**随机**抽 1 张加入自己手牌；对方手牌为空则无效果 |
| 3 张同花色 | 3 张卡的花色相同 | 指定一名存活对手 + 指定一个 `CardKind` 名称；对方若持有该卡，必须交出 1 张（若有多张，由对方决定交哪张）；没有则无效果 |
| 5 张不同花色 | 5 张卡花色两两不同 | 从弃牌堆中**任选 1 张非 `exploding_kitten` 的卡**加入手牌；弃牌堆为空或只剩爆炸猫则无效果 |

规则补充：
- 组合牌打出后，卡面原有文字效果全部忽略，只执行组合效果；打出的牌全部进弃牌堆。
- 组合算一次行动，可被 1 张休想整体抵消；被抵消后牌不退回。
- 「3 张同花色点名索要 `defuse`」与「5 张不同花从弃牌堆捞回 `defuse`」是全局最强两条线，AI 必须能识别（见第 11 节）。
- **爆炸猫不得作为组合素材，也不得被从弃牌堆捞回**（`kittenFromDiscard = forbidden`）。理由见 9.1 的守恒推导：一旦爆炸猫退出牌库循环，「牌库张数归零」与「游戏结束」就不再同步，会出现「牌库空了但仍有 2 人以上存活」的死局。

---

## 9. 抽牌、爆炸、拆弹

### 9.1 牌库收支与抽空（v1.1 修订）

**先纠正一个常见误读**：官方说明书写的是 "You won't ever run out of cards in the Draw Pile, so there's never a need to reshuffle"，它的准确含义是「不会在**需要抽牌时**面对一个空牌库，所以不需要洗牌」，**不是**「牌库张数永远不会降到 0」。

**牌库是只减不增的**：普通牌一旦被抽走就进手牌、打出后进弃牌堆，**永远不会回到牌库**；唯一回到牌库的是拆弹时插回的爆炸猫。三种抽牌结果对状态的影响：

| 抽到的结果 | 牌库张数 D | 牌库内爆炸猫数 k | 存活人数 |
|---|---|---|---|
| 普通牌（含 `defuse`） | `D − 1` | 不变 | 不变 |
| 爆炸猫 + 拆弹插回 | 不变 | 不变 | 不变 |
| 爆炸猫 + 出局 | `D − 1` | `k − 1` | `− 1` |

由此得到**守恒不变量**（实现时必须断言）：

```
存活人数 === 1 + k                      // 恒成立，最容易断言
k === N − 1 − 累计出局数                // 等价形式
GAME_OVER  ⟺  存活人数 === 1  ⟺  k === 0
D === 0  ⟹  k === 0  ⟹  GAME_OVER     // 单向：牌库归零必然意味着游戏已结束
```

推导：`k` 初始为 `N−1`，每次出局消耗 1 张爆炸猫，所以存活人数恒等于 `1 + k`；游戏结束需要 `N−1` 次出局，此时 `k=0`。因为只要 `k>0`，牌库里至少还有 1 张爆炸猫（`D>=1`），所以「牌库空了还要抽牌」在官方规则下不可能发生 —— 这就是官方那句话成立的原因。

**但牌库确实可能被抽到 0**：若洗牌顺序使所有普通牌先被抽光、牌库只剩 k 张爆炸猫，则之后每次抽牌必是爆炸猫，连续出局，最后一次出局让 `D` 从 1 → 0，同时游戏结束。所以「牌库 0 张」是会出现的终局画面，只是不会出现在可操作状态中。

**以下任一情况会打破守恒，导致「牌库空了但游戏未结束」，数字实现必须按 `deckEmptyPolicy` 处理**：

1. **把弃牌堆原样洗回牌库**（v1.0 的 `reshuffleDiscard` 正是此错误）：弃牌堆里有出局者的爆炸猫，洗回后爆炸猫「复活」，`k` 增加而存活人数不变，`存活 = 1 + k` 失效，游戏可能永远打不完并反复抽空。
2. **5 张不同花色把爆炸猫从弃牌堆捞进手牌**：该卡退出牌库循环；若 `comboScope = anyMatchingIcon` 还能把它当组合素材打出，守恒彻底失效。官方在《Streaking Kittens》扩展里对这条的评语就是 "Because it breaks the game"。
3. **拆弹插回未正确执行**（实现 bug、玩家取消、`defusePlacement` 索引越界）：`k` 凭空少 1。
4. **变体牌组 / 扩展 / 动态人数**：牌库张数与 `N−1` 的对应关系被改写。
5. **无限免抽僵局**：`skip` / `attack` 循环让牌库不减也不结束，属于另一个方向，由 `maxTurns` 兜底。

**抽牌执行顺序（必须按此实现）**：

```
if drawPile.length === 0:
    assertInvariant()                        // 记录守恒偏差，供排查
    switch config.deckEmptyPolicy:
      case 'endGame':  -> resolveByTieBreaker(); GAME_OVER
      case 'reshuffleNoKittens':
          drawPile = shuffle(discardPile.filter(c => c.kind !== 'exploding_kitten'))
          discardPile = discardPile.filter(c => c.kind === 'exploding_kitten')
      case 'error':    -> throw InvariantViolation
    if drawPile.length === 0: -> resolveByTieBreaker(); GAME_OVER   // 洗回后仍为空，防死循环
card = drawPile.shift()
```

**禁止事项**：任何情况下都不得把 `exploding_kitten` 从弃牌堆放回牌库；不得在牌库为空时静默跳过抽牌（会造成「白嫖一个回合」，破坏 `pendingTurns` 与胜利判定）；不得在 `DRAW` 阶段卡住等待玩家操作。

**UI 提示**：牌库剩余张数是公开信息且会真实降到 1、2 张，这是本作后期紧张感的来源，必须常显；`drawPile.length === 0` 时立即展示终局界面，不要留一个「牌库 0 张」的可操作状态。

### 9.2 抽到爆炸猫且持有拆除卡
1. 立即展示爆炸猫（公开事件）。
2. **不开休想窗口**，任何人不能干预。
3. 移除 1 张 `defuse` 放入弃牌堆（用完作废）。
4. 玩家选择插入位置 `index ∈ [0, drawPile.length]`（`0` = 牌库顶，可精准坑下家；`length` = 牌库底）。插入过程中不得查看或重排其他牌；`defusePlacement = topOnly` 时固定 `index = 0`。
5. 插入位置**仅该玩家可见**，日志只记录「某玩家拆弹成功」，不记录 index。
6. **立即结束当前这 1 个回合，不补抽牌**：`p.pendingTurns -= 1`；若其仍有剩余回合（被攻击累积），继续执行剩余回合。
7. 之后轮到下一位玩家；下家仍可用 `skip` / `attack` 免抽、用 `shuffle` 洗乱、或用 `see_future` 确认后再决策，所以把爆炸猫放牌库顶**不等于**下家必死。

### 9.3 抽到爆炸猫且无拆除卡
1. 该玩家 `alive = false`，`pendingTurns = 0`。
2. **全部手牌（包括没用掉的 `defuse`）连同这张爆炸猫一起进入弃牌堆** —— 这是官方平衡规则，也是后期能用「5 张不同花」捞回保命牌的原因，绝不能省略。
3. 从回合顺序中跳过该玩家。

---

## 10. 胜负、终局与僵局

**常规终局**：每次 `TURN_END` 检查存活人数，`aliveCount === 1` → `GAME_OVER`，唯一存活者获胜。`aliveCount === 0` 为非法状态，断言报错。2 人局同样适用（牌库只放 1 张爆炸猫）。

**抽空终局**（`deckEmptyPolicy = endGame`、洗回后仍为空、或达到 `maxTurns` 时）：若 `aliveCount > 1`，按以下顺序判定，避免平局卡死：

1. 持有 `defuse` 张数最多的存活玩家获胜；
2. 仍平局 → 手牌张数最多者获胜；
3. 仍平局 → 判定为和局，展示「平局」而非继续抽牌。

`resolveByTieBreaker()` 必须是纯函数、一次性结算，不得回到 `ACTION` 阶段。

**不变量断言**：每次 `TURN_END` 校验 `存活人数 === 1 + k`（`k` = `drawPile` 中 `exploding_kitten` 数量）。`invariantCheck = true` 时偏差写 warning 日志（含 seed、回合数、两堆张数），便于复现；不阻断游戏。

**僵局**：`skip` / `attack` 可让回合不消耗牌库。累计 `turnCount` 达到 `maxTurns` 时强制调用 `resolveByTieBreaker()` 结束，并在日志标注 `stalled`。AI 不得利用免抽卡无限拖延（见 11.1）。

**公开/保密信息**：官方允许所有玩家随时查看牌库剩余张数，UI 必须常显；牌库顺序保密。牌库张数、弃牌堆内容、各玩家存活状态与手牌张数公开；手牌内容、先知结果、拆弹插入位置保密。

---

## 11. AI 策略与移动端交互约束

### 11.1 AI 决策优先级（启发式，可分级）

1. 持有 `defuse` 时绝不主动消耗，也不主动送给别人。
2. `see_future` 判定牌库顶是爆炸猫且自己没有 `defuse` 时：优先 `attack` → `skip` → `shuffle`（有哪张用哪张），否则不抽牌必死。
3. 能用「3 张同花色」时，优先点名索要 `defuse`；能用「5 张不同花」时，优先从弃牌堆捞 `defuse`。
4. `nope` 只用于抵挡：对自己生效的 `attack`、对手索要自己的 `defuse`、对手从弃牌堆捞 `defuse`。不浪费在 `see_future` 之类低价值行动上。
5. 拆弹后默认把爆炸猫放牌库顶（`index = 0`）坑下家；若已知下家持有 `skip`/`attack`，可放 `index = 1` 或更后。
6. 难度分级：`easy` = 随机合法出牌；`normal` = 上述启发式；`hard` = 额外记牌库剩余张数与已知顶牌，估算抽中爆炸猫概率。
7. 禁止无限免抽：AI 不得为了回避风险循环打出 `skip` / `attack` 拖延到 `maxTurns`；牌库剩余张数偏少时优先主动结束回合。

### 11.2 移动端约束（会影响规则实现方式，不是纯 UI 问题）

| 场景 | 要求 |
|---|---|
| 秘密信息 | `localPassAndPlay` 模式必须有「交接屏」：手牌、先知结果、拆弹插牌界面在交给下一位玩家前必须完全遮挡，不留在 DOM 可见状态 |
| 休想窗口 | AI 立即 pass；多真人时给 `nopeWindowTimeoutMs` 倒计时，全员 pass 后可提前关闭；窗口期间禁止其他操作 |
| 拆弹插牌 | 提供位置拖动条 + 快捷按钮「牌库顶 / 牌库底 / 随机」；插入位置不得写入公开日志或广播 |
| 牌库归零 | `drawPile.length === 0` 时立即切终局界面；禁止展示「牌库 0 张」且仍可出牌的状态，禁止静默跳过抽牌 |
| 结算与动画 | 先完成状态变更再播放动画，动画期间锁定输入；禁止「动画里改状态」造成的双抽 / 漏抽 |
| 可复现性 | 所有洗牌、随机抽对手手牌、随机插入位置都走同一个 seeded RNG，日志保留 seed，便于复现测试用例 |
| 常显信息 | 牌库剩余张数、弃牌堆张数、各玩家存活状态与手牌张数、当前是谁的回合、该玩家剩余 `pendingTurns` |

---

## 12. 验收用例（Given / When / Then）

| # | 场景 | 期望结果 |
|---|---|---|
| 1 | 4 人局开局 | 每人 5 张手牌且恰含 1 张 `defuse`；牌库含 3 张爆炸猫和 2 张 `defuse`；牌库共 35 张 |
| 2 | 玩家打出 1 张 `skip` | 不抽牌，`pendingTurns` 减 1，轮到下一位 |
| 3 | 玩家被 `attack`（`pendingTurns=2`）后打 1 张 `skip` | 只抵掉 1 个回合，该玩家仍需再执行 1 个回合；连打 2 张 `skip` 才可全部抵掉 |
| 4 | `official` 模式下 A 攻击 B，B 在自己回合打出 `attack` | B 剩余回合全部取消，由 C 承担 2 个回合（**不是** 4 个回合） |
| 5 | `stacked` 模式下 A 单回合连打 2 张 `attack` | 下家连续进行 3 个回合 |
| 6 | A 打出 `attack`，C 打 `nope`，A 再打 `nope` | 共 2 张休想（偶数），攻击生效；A 仍不抽牌 |
| 7 | A 打出 `favor`，B 打 1 张 `nope` | 恩惠被抵消，卡进弃牌堆，A 仍处 `ACTION` 阶段可继续出牌 |
| 8 | 玩家抽到爆炸猫并使用 `defuse` | 不生成响应窗口（休想无效）；爆炸猫回到牌库；该回合立即结束，不补抽牌；插入位置不出现在公开日志；`k` 不变 |
| 9 | 玩家抽到爆炸猫且无 `defuse` | 玩家出局，其**全部**手牌与爆炸猫进弃牌堆；存活人数减 1；`k` 减 1；`存活人数 === 1 + k` 仍成立 |
| 10 | 弃牌堆含 `defuse` 时打出 5 张不同花色 | 可把该 `defuse` 捞回手牌；此行动可被 1 张 `nope` 整体抵消 |
| 11 | 用 3 张同花色向持有 2 张 `defuse` 的对手点名索要 `defuse` | 对方交出 1 张（由对方决定哪张），索要方获得 1 张 |
| 12 | 只剩 1 名存活玩家 | 立即 `GAME_OVER`，该玩家获胜，不再继续抽牌 |
| 13 | 5 人局人为构造「普通牌先被抽光」的顺序 | 牌库只剩 4 张爆炸猫；每次出局 `k` 减 1；第 4 次出局时 `D=0`、`k=0`、存活 1 人、`GAME_OVER` 同时发生；不存在「牌库 0 张仍可操作」的状态 |
| 14 | 人为构造 `drawPile=[]` 且存活 2 人时轮到抽牌 | `endGame` 下立即按 tie-breaker 判定并 `GAME_OVER`；不崩溃、不静默跳过抽牌、不无限循环 |
| 15 | `reshuffleNoKittens` 且弃牌堆含出局者的爆炸猫 | 只有非爆炸猫牌被洗回牌库，爆炸猫留在弃牌堆；牌库中 `k` 不增加；洗回后仍为空则立即终局 |
| 16 | `kittenFromDiscard = forbidden` 时打出 5 张不同花色，弃牌堆只有爆炸猫 | 该行动无效果，爆炸猫仍在弃牌堆，守恒不变量保持成立 |
| 17 | 连续 `skip` / `attack` 免抽达到 `maxTurns` | 日志标记 `stalled`，调用 tie-breaker 结束，游戏不挂起 |
| 18 | 任一回合结束时 `存活人数 !== 1 + k` | `invariantCheck` 写出含 seed 的 warning 日志，可用于复现 |

---

## 13. 已知歧义与处理记录

| 分歧点 | 本文档的处理 |
|---|---|
| 攻击卡能否叠加 | 官方说明书是「转嫁」不是「累加」；中文笔记与部分手游采用「叠加」。默认 `official`，`stacked` 作为开关保留，开局前统一即可 |
| 2 张同花色的素材范围 | 原版仅无技能猫咪牌；新版 / 扩展放宽到任意同图标卡。默认 `catCardsOnly` |
| 弃牌堆是否公开 | 官方「翻查弃牌堆任选 1 张」意味着内容可查；部分中文民间写法为面朝下。本规格采用官方口径：公开 |
| 拆除卡使用后是否继续出牌 | 官方「立即结束回合」。本文档明确：消耗 1 个回合，不补抽牌，剩余 `pendingTurns` 继续 |
| 出局者手牌去向 | 官方「弃掉所有牌」。笔记漏写，本规格强制包含 `defuse` |
| 牌库是否会抽空 | **会**。官方 "won't ever run out of cards" 只表示「不会在需要抽牌时面对空牌库」，因为 `存活人数 = 1 + k`、`D=0 ⟹ k=0 ⟹ GAME_OVER`；牌库张数确实会单调降到 0（在普通牌先被抽光的顺序下）。v1.0 的 `reshuffleDiscard` 兜底是错的（会复活弃牌堆里的爆炸猫，令守恒失效、游戏永不结束），v1.1 改为 `endGame` + 守恒断言 + 禁止爆炸猫回牌库，详见 9.1 |
| 爆炸猫能否从弃牌堆捞回 | 官方基础版未明写，但《Streaking Kittens》扩展明确禁止并注明 "Because it breaks the game"。本规格默认 `forbidden` |

---

## 14. 合规提示

《Exploding Kittens》名称、卡面插画与角色均为受保护的商标 / 版权内容。本规格用于**自用原型、学习或非公开演示**没有问题；若计划公开发布或商业化，请更换游戏名、美术与卡牌命名（本文已把 5 种猫咪花色抽象为 A–E 以便替换），或取得权利方授权。国内应用商店中已有若干同名 / 近似名称的仿制手游，取名时注意区分。
