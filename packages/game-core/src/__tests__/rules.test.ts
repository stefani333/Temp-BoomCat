import { describe, expect, it } from 'vitest';
import {
  GameEngine,
  buildDeck,
  cardDisplayName,
  countCards,
  getGameView,
  nextBotStep,
  runFullSimulation,
  type Card,
  type CardType,
  type CatName,
  type GameState,
} from '../index';

let cardSeq = 0;

function makeCard(type: CardType, cat?: CatName): Card {
  cardSeq += 1;
  return { id: `t-${cardSeq}`, type, ...(cat ? { cat } : {}) };
}

function startGame(playerCount: 2 | 3 | 4 | 5, seed = 20261123): GameEngine {
  const engine = GameEngine.createRoom({ targetPlayerCount: playerCount, seed, hostName: '测试玩家' });
  const letters = 'BCDE';
  for (let seat = 2; seat <= playerCount; seat += 1) {
    engine.apply({ type: 'JOIN_ROOM', name: `测试机器人 ${letters[seat - 2]}`, isBot: true });
  }
  for (const player of engine.state.players) {
    engine.apply({ type: 'SET_READY', playerId: player.id, ready: true });
  }
  const result = engine.apply({ type: 'START_GAME', playerId: 'p1' });
  expect(result.ok).toBe(true);
  return engine;
}

function player(state: GameState, id: string) {
  const found = state.players.find((p) => p.id === id);
  if (!found) throw new Error(`缺少玩家 ${id}`);
  return found;
}

function stripType(state: GameState, type: CardType): void {
  for (const p of state.players) {
    p.hand = p.hand.filter((c) => c.type !== type);
  }
}

function clearNopes(state: GameState): void {
  stripType(state, 'nope');
}

function give(state: GameState, playerId: string, card: Card): Card {
  player(state, playerId).hand.push(card);
  return card;
}

function setHand(state: GameState, playerId: string, cards: Card[]): void {
  player(state, playerId).hand = cards;
}

function setDrawPile(state: GameState, cards: Card[]): void {
  state.drawPile = cards;
}

function handIndexOf(state: GameState, playerId: string, type: CardType): string {
  const card = player(state, playerId).hand.find((c) => c.type === type);
  if (!card) throw new Error(`手牌中没有 ${type}`);
  return card.id;
}

function eventText(state: GameState): string {
  return state.eventLog.map((e) => e.message).join('\n');
}

describe('卡牌定义与开局', () => {
  it('整套卡牌为 56 张且数量符合规则', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(56);
    const count = (type: CardType) => deck.filter((c) => c.type === type).length;
    expect(count('bomb')).toBe(4);
    expect(count('defuse')).toBe(6);
    expect(count('nope')).toBe(5);
    expect(count('favor')).toBe(4);
    expect(count('attack')).toBe(4);
    expect(count('skip')).toBe(4);
    expect(count('shuffle')).toBe(4);
    expect(count('seeFuture')).toBe(5);
    expect(count('cat')).toBe(20);
  });

  it.each([
    [2, 42, 2, 2],
    [3, 39, 2, 0],
    [4, 35, 1, 0],
    [5, 31, 0, 0],
  ] as const)('%i 人局发牌与牌堆规模正确', (count, drawSize, bombsRemoved, defusesRemoved) => {
    const engine = startGame(count);
    const state = engine.state;
    expect(state.players).toHaveLength(count);
    for (const p of state.players) {
      expect(p.hand).toHaveLength(5);
      expect(p.hand.filter((c) => c.type === 'defuse')).toHaveLength(1);
    }
    expect(state.drawPile).toHaveLength(drawSize);
    expect(state.removedPile.filter((c) => c.type === 'bomb')).toHaveLength(bombsRemoved);
    expect(state.removedPile.filter((c) => c.type === 'defuse')).toHaveLength(defusesRemoved);
    expect(countCards(state)).toBe(56);
  });

  it('未达到开始条件时拒绝开始游戏，新开一局默认房主先手', () => {
    const engine = GameEngine.createRoom({ targetPlayerCount: 3, seed: 1 });
    engine.apply({ type: 'JOIN_ROOM', name: '机器人 B', isBot: true });
    expect(engine.blockReason()).toBe('人数不足');
    engine.apply({ type: 'JOIN_ROOM', name: '机器人 C', isBot: true });
    expect(engine.blockReason()).toBe('有玩家未准备');
    for (const p of engine.state.players) {
      engine.apply({ type: 'SET_READY', playerId: p.id, ready: true });
    }
    expect(engine.blockReason()).toBeNull();
    const result = engine.apply({ type: 'START_GAME', playerId: 'p1' });
    expect(result.ok).toBe(true);
    expect(engine.state.startPlayerId).toBe('p1');
    expect(engine.state.currentPlayerId).toBe('p1');
  });

  it('上一局胜者可被设为下一局起始玩家', () => {
    const engine = GameEngine.createRoom({ targetPlayerCount: 2, seed: 1 });
    engine.apply({ type: 'JOIN_ROOM', name: '机器人 B', isBot: true });
    for (const p of engine.state.players) {
      engine.apply({ type: 'SET_READY', playerId: p.id, ready: true });
    }
    expect(engine.apply({ type: 'SET_START_PLAYER', playerId: 'p1', startPlayerId: 'p2' }).ok).toBe(true);
    expect(engine.apply({ type: 'START_GAME', playerId: 'p1' }).ok).toBe(true);
    expect(engine.state.currentPlayerId).toBe('p2');
  });

  it('非房主不能指定起始玩家或开始游戏', () => {
    const engine = GameEngine.createRoom({ targetPlayerCount: 2, seed: 1 });
    engine.apply({ type: 'JOIN_ROOM', name: '机器人 B', isBot: true });
    expect(engine.apply({ type: 'SET_START_PLAYER', playerId: 'p2', startPlayerId: 'p2' }).ok).toBe(false);
    expect(engine.apply({ type: 'START_GAME', playerId: 'p2' }).ok).toBe(false);
  });
});

describe('回合、出牌与抽牌', () => {
  it('抽到普通牌后加入手牌并结束回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    const before = player(engine.state, 'p1').hand.length;
    const drawn = makeCard('skip');
    setDrawPile(engine.state, [drawn, makeCard('favor'), makeCard('shuffle')]);
    const result = engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(result.ok).toBe(true);
    expect(player(engine.state, 'p1').hand).toHaveLength(before + 1);
    expect(player(engine.state, 'p1').hand.some((c) => c.id === drawn.id)).toBe(true);
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(engine.state.turnsRemaining).toBe(1);
  });

  it('非当前玩家不能出牌或抽牌', () => {
    const engine = startGame(3);
    const card = give(engine.state, 'p2', makeCard('skip'));
    expect(engine.apply({ type: 'PLAY_CARD', playerId: 'p2', cardIds: [card.id] }).ok).toBe(false);
    expect(engine.apply({ type: 'DRAW_CARD', playerId: 'p2' }).ok).toBe(false);
  });

  it('特殊猫咪不能单张打出，休想不能作为主动出牌', () => {
    const engine = startGame(3);
    const cat = give(engine.state, 'p1', makeCard('cat', 'burger'));
    expect(engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [cat.id] }).ok).toBe(false);
    const nope = give(engine.state, 'p1', makeCard('nope'));
    expect(engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [nope.id] }).ok).toBe(false);
  });

  it('空手牌玩家仍可抽牌', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', []);
    setDrawPile(engine.state, [makeCard('favor'), makeCard('skip')]);
    expect(engine.apply({ type: 'DRAW_CARD', playerId: 'p1' }).ok).toBe(true);
    expect(player(engine.state, 'p1').hand).toHaveLength(1);
  });

  it('抽牌堆为空时拒绝抽牌且不改变回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setDrawPile(engine.state, []);
    const result = engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('抽牌堆已空');
    expect(engine.state.currentPlayerId).toBe('p1');
  });

  it('重复提交同一操作不会重复结算', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setDrawPile(engine.state, [makeCard('favor'), makeCard('skip'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' }, 'act-1');
    const handSize = player(engine.state, 'p1').hand.length;
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' }, 'act-1');
    expect(player(engine.state, 'p1').hand).toHaveLength(handSize);
  });

  it('对局结束后拒绝改变状态的操作', () => {
    const engine = startGame(2);
    clearNopes(engine.state);
    stripType(engine.state, 'defuse');
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(engine.state.phase).toBe('finished');
    expect(engine.state.winnerPlayerId).toBe('p2');
    expect(engine.apply({ type: 'DRAW_CARD', playerId: 'p2' }).ok).toBe(false);
  });
});

describe('炸弹猫与淘汰', () => {
  it('抽到炸弹猫且持有拆除时，可秘密放回指定位置并结束回合', () => {
    const engine = startGame(3);
    const bomb = makeCard('bomb');
    setDrawPile(engine.state, [bomb, makeCard('skip'), makeCard('skip'), makeCard('skip')]);
    expect(engine.apply({ type: 'DRAW_CARD', playerId: 'p1' }).ok).toBe(true);
    expect(engine.state.pending?.kind).toBe('bomb');
    expect(engine.state.pending?.awaiting).toBe('bombDecision');
    const defuseCount = player(engine.state, 'p1').hand.filter((c) => c.type === 'defuse').length;
    expect(defuseCount).toBe(1);
    expect(engine.apply({ type: 'RESOLVE_BOMB', playerId: 'p1', useDefuse: true }).ok).toBe(true);
    expect(engine.state.pending?.awaiting).toBe('bombInsert');
    expect(engine.apply({ type: 'CHOOSE_BOMB_INSERT', playerId: 'p1', index: 1 }).ok).toBe(true);
    expect(engine.state.drawPile[1]?.id).toBe(bomb.id);
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(player(engine.state, 'p1').hand.filter((c) => c.type === 'defuse')).toHaveLength(0);
    expect(eventText(engine.state)).toContain('秘密放回');
  });

  it('没有拆除卡的玩家抽到炸弹猫即淘汰，手牌移出本局', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    stripType(engine.state, 'defuse');
    const bomb = makeCard('bomb');
    setDrawPile(engine.state, [bomb, makeCard('skip')]);
    const handSize = player(engine.state, 'p1').hand.length;
    const removedBefore = engine.state.removedPile.length;
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(player(engine.state, 'p1').alive).toBe(false);
    expect(player(engine.state, 'p1').hand).toHaveLength(0);
    expect(engine.state.removedPile.some((c) => c.id === bomb.id)).toBe(true);
    expect(engine.state.removedPile).toHaveLength(removedBefore + handSize + 1);
    expect(engine.state.phase).toBe('playing');
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(engine.state.turnsRemaining).toBe(1);
  });

  it('最后一名存活玩家获胜', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    stripType(engine.state, 'defuse');
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('bomb'), makeCard('bomb')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(engine.state.currentPlayerId).toBe('p2');
    engine.apply({ type: 'DRAW_CARD', playerId: 'p2' });
    expect(player(engine.state, 'p2').alive).toBe(false);
    expect(engine.state.phase).toBe('finished');
    expect(engine.state.winnerPlayerId).toBe('p3');
    expect(eventText(engine.state)).toContain('赢得对局');
  });

  it('炸弹猫处理不进入休想反制窗口', () => {
    const engine = startGame(3);
    give(engine.state, 'p2', makeCard('nope'));
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(engine.state.pending?.awaiting).toBe('bombDecision');
    expect(engine.state.pending?.counterQueue).toHaveLength(0);
  });
});

describe('休想反制链', () => {
  it('休想可以取消普通卡牌效果', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    give(engine.state, 'p1', makeCard('skip'));
    give(engine.state, 'p2', makeCard('nope'));
    const skipId = handIndexOf(engine.state, 'p1', 'skip');
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [skipId] });
    expect(engine.state.pending?.awaiting).toBe('counter');
    expect(engine.state.pending?.counterQueue[0]).toBe('p2');
    expect(engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p2', useNope: true }).ok).toBe(true);
    expect(engine.state.pending).toBeNull();
    expect(engine.state.currentPlayerId).toBe('p1');
    expect(eventText(engine.state)).toContain('被休想取消');
  });

  it('休想可以被另一张休想反制，偶数层恢复原效果', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    give(engine.state, 'p1', makeCard('skip'));
    give(engine.state, 'p1', makeCard('nope'));
    give(engine.state, 'p2', makeCard('nope'));
    const skipId = handIndexOf(engine.state, 'p1', 'skip');
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [skipId] });
    engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p2', useNope: true });
    expect(engine.state.pending?.counterQueue).toEqual(['p1']);
    expect(engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p1', useNope: true }).ok).toBe(true);
    expect(engine.state.pending).toBeNull();
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(eventText(engine.state)).toContain('反制层数 2');
  });

  it('非当前回合玩家也可以使用休想，未轮到者不能抢先响应', () => {
    const engine = startGame(4);
    clearNopes(engine.state);
    give(engine.state, 'p1', makeCard('favor'));
    give(engine.state, 'p2', makeCard('nope'));
    give(engine.state, 'p3', makeCard('nope'));
    const favorId = handIndexOf(engine.state, 'p1', 'favor');
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [favorId], targetPlayerId: 'p2' });
    expect(engine.state.pending?.awaiting).toBe('counter');
    expect(engine.state.pending?.counterQueue).toEqual(['p2', 'p3']);
    expect(engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p3', useNope: true }).ok).toBe(false);
    expect(engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p2', useNope: false }).ok).toBe(true);
    expect(engine.apply({ type: 'RESPOND_COUNTER', playerId: 'p3', useNope: true }).ok).toBe(true);
    expect(engine.state.pending?.kind).toBe('favor');
    expect(engine.state.pending?.counterStack).toHaveLength(1);
  });
});

describe('特殊卡牌效果', () => {
  it('恩惠由目标玩家自行选择交出的手牌', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p2', [makeCard('defuse'), makeCard('skip')]);
    const favor = give(engine.state, 'p1', makeCard('favor'));
    const before = player(engine.state, 'p1').hand.length;
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [favor.id], targetPlayerId: 'p2' });
    expect(engine.state.pending?.awaiting).toBe('favorGive');
    const chosen = player(engine.state, 'p2').hand.find((c) => c.type === 'skip');
    expect(chosen).toBeTruthy();
    expect(engine.apply({ type: 'CHOOSE_FAVOR_CARD', playerId: 'p2', cardId: chosen?.id ?? '' }).ok).toBe(true);
    expect(player(engine.state, 'p1').hand).toHaveLength(before);
    expect(player(engine.state, 'p1').hand.some((c) => c.type === 'skip')).toBe(true);
    expect(player(engine.state, 'p2').hand).toHaveLength(1);
  });

  it('恩惠、两张猫与三张猫禁止选择空手牌目标', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p2', []);
    const favor = give(engine.state, 'p1', makeCard('favor'));
    const favorResult = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: [favor.id],
      targetPlayerId: 'p2',
    });
    expect(favorResult.ok).toBe(false);
    expect(favorResult.error).toContain('没有手牌');

    setHand(engine.state, 'p1', [makeCard('cat', 'burger'), makeCard('cat', 'burger')]);
    const twoCats = player(engine.state, 'p1').hand.map((c) => c.id);
    const twoResult = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: twoCats,
      targetPlayerId: 'p2',
    });
    expect(twoResult.ok).toBe(false);
    expect(twoResult.error).toContain('没有手牌');

    setHand(engine.state, 'p1', [
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
    ]);
    const threeCats = player(engine.state, 'p1').hand.map((c) => c.id);
    const threeResult = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: threeCats,
      targetPlayerId: 'p2',
      namedCardName: 'skip',
    });
    expect(threeResult.ok).toBe(false);
    expect(threeResult.error).toContain('没有手牌');
    expect(player(engine.state, 'p1').hand).toHaveLength(3);
  });

  it('三张相同猫咪不能指定炸弹猫', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', [
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
    ]);
    const ids = player(engine.state, 'p1').hand.map((c) => c.id);
    const result = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: ids,
      targetPlayerId: 'p2',
      namedCardName: 'bomb',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不能指定炸弹猫');
    expect(player(engine.state, 'p1').hand).toHaveLength(3);
  });

  it('攻击状态下抽到炸弹被淘汰时，攻击失效且下一位从正常回合开始', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    stripType(engine.state, 'defuse');
    engine.state.currentPlayerId = 'p1';
    engine.state.turnsRemaining = 2;
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(player(engine.state, 'p1').alive).toBe(false);
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(engine.state.turnsRemaining).toBe(1);
  });

  it('攻击使下一位玩家获得两个回合，再次攻击只转移不叠加', () => {
    const engine = startGame(4);
    clearNopes(engine.state);
    const attack1 = give(engine.state, 'p1', makeCard('attack'));
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [attack1.id] });
    expect(engine.state.currentPlayerId).toBe('p2');
    expect(engine.state.turnsRemaining).toBe(2);

    const attack2 = give(engine.state, 'p2', makeCard('attack'));
    engine.apply({ type: 'PLAY_CARD', playerId: 'p2', cardIds: [attack2.id] });
    expect(engine.state.currentPlayerId).toBe('p3');
    expect(engine.state.turnsRemaining).toBe(2);
  });

  it('攻击状态下跳过只结束一个回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    engine.state.currentPlayerId = 'p1';
    engine.state.turnsRemaining = 2;
    const skip = give(engine.state, 'p1', makeCard('skip'));
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [skip.id] });
    expect(engine.state.currentPlayerId).toBe('p1');
    expect(engine.state.turnsRemaining).toBe(1);
    const skip2 = give(engine.state, 'p1', makeCard('skip'));
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [skip2.id] });
    expect(engine.state.currentPlayerId).toBe('p2');
  });

  it('攻击状态下拆除炸弹只结束一个回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    engine.state.currentPlayerId = 'p1';
    engine.state.turnsRemaining = 2;
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    engine.apply({ type: 'RESOLVE_BOMB', playerId: 'p1', useDefuse: true });
    engine.apply({ type: 'CHOOSE_BOMB_INSERT', playerId: 'p1', index: 0 });
    expect(engine.state.currentPlayerId).toBe('p1');
    expect(engine.state.turnsRemaining).toBe(1);
  });

  it('洗混只改变抽牌堆顺序且不结束回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    const shuffle = give(engine.state, 'p1', makeCard('shuffle'));
    const before = engine.state.drawPile.map((c) => c.id).sort().join(',');
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [shuffle.id] });
    const after = engine.state.drawPile.map((c) => c.id).sort().join(',');
    expect(after).toBe(before);
    expect(engine.state.currentPlayerId).toBe('p1');
    expect(engine.state.pending).toBeNull();
    expect(player(engine.state, 'p1').hand.some((c) => c.id === shuffle.id)).toBe(false);
  });

  it('预见未来仅使用者可见，按原顺序放回且不结束回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    const top = [makeCard('bomb'), makeCard('skip'), makeCard('favor')];
    setDrawPile(engine.state, [...top, makeCard('shuffle')]);
    const seeFuture = give(engine.state, 'p1', makeCard('seeFuture'));
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [seeFuture.id] });
    expect(engine.state.pending?.awaiting).toBe('seeFutureAck');
    const viewMine = getGameView(engine, 'p1');
    const viewOther = getGameView(engine, 'p2');
    expect(viewMine.pending?.seenCards?.map((c) => c.id)).toEqual(top.map((c) => c.id));
    expect(viewOther.pending?.seenCards).toBeUndefined();
    engine.apply({ type: 'ACK_SEE_FUTURE', playerId: 'p1' });
    expect(engine.state.drawPile.slice(0, 3).map((c) => c.id)).toEqual(top.map((c) => c.id));
    expect(engine.state.currentPlayerId).toBe('p1');
    expect(engine.state.turnsRemaining).toBe(1);
  });

  it('两张相同猫咪从目标手牌随机抽取一张', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', [makeCard('cat', 'burger'), makeCard('cat', 'burger')]);
    setHand(engine.state, 'p2', [makeCard('skip'), makeCard('favor')]);
    const ids = player(engine.state, 'p1').hand.map((c) => c.id);
    engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: ids, targetPlayerId: 'p2' });
    expect(player(engine.state, 'p1').hand).toHaveLength(1);
    expect(player(engine.state, 'p2').hand).toHaveLength(1);
    expect(engine.state.discardPile.filter((c) => c.type === 'cat')).toHaveLength(2);
  });

  it('三张相同猫咪指定名称成功时获得对应卡牌', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', [
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
    ]);
    setHand(engine.state, 'p2', [makeCard('skip'), makeCard('defuse')]);
    const ids = player(engine.state, 'p1').hand.map((c) => c.id);
    engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: ids,
      targetPlayerId: 'p2',
      namedCardName: 'skip',
    });
    expect(player(engine.state, 'p1').hand.some((c) => c.type === 'skip')).toBe(true);
    expect(player(engine.state, 'p2').hand).toHaveLength(1);
  });

  it('三张相同猫咪失败时三张猫咪退回手牌', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', [
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'fries'),
    ]);
    setHand(engine.state, 'p2', [makeCard('defuse')]);
    const ids = player(engine.state, 'p1').hand.map((c) => c.id);
    engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: ids,
      targetPlayerId: 'p2',
      namedCardName: 'attack',
    });
    expect(player(engine.state, 'p1').hand).toHaveLength(3);
    expect(engine.state.discardPile).toHaveLength(0);
    expect(eventText(engine.state)).toContain('组合失败');
  });

  it('五张不同猫咪从弃牌堆选牌，弃牌堆为空时禁止打出', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setHand(engine.state, 'p1', [
      makeCard('cat', 'iceCream'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'burger'),
      makeCard('cat', 'burrito'),
      makeCard('cat', 'friedChicken'),
    ]);
    const ids = player(engine.state, 'p1').hand.map((c) => c.id);
    const rejected = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: ids,
      discardCardId: 'none',
    });
    expect(rejected.ok).toBe(false);

    const discard = makeCard('skip');
    engine.state.discardPile.push(discard);
    const result = engine.apply({
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardIds: ids,
      discardCardId: discard.id,
    });
    expect(result.ok).toBe(true);
    expect(player(engine.state, 'p1').hand.some((c) => c.id === discard.id)).toBe(true);
    expect(engine.state.discardPile.some((c) => c.id === discard.id)).toBe(false);
  });
});

describe('可见性与模拟对局', () => {
  it('玩家视图不包含其他玩家手牌明细', () => {
    const engine = startGame(4);
    const view = getGameView(engine, 'p1');
    expect(view.myHand).toHaveLength(5);
    for (const p of view.players) {
      expect(Object.keys(p)).not.toContain('hand');
      expect(p.handCount).toBeGreaterThanOrEqual(0);
    }
    expect(view.drawPileCount).toBe(engine.state.drawPile.length);
    expect(JSON.stringify(view)).not.toContain(engine.state.players[1]?.hand[0]?.id ?? '###');
  });

  it.each([2, 3, 4, 5] as const)('%i 人局模拟玩家可以跑完整局', (count) => {
    const outcome = runFullSimulation({ playerCount: count, seed: 9000 + count });
    expect(outcome.error).toBeUndefined();
    expect(outcome.finished).toBe(true);
    expect(outcome.winnerId).toBeTruthy();
    expect(outcome.state.phase).toBe('finished');
    expect(outcome.state.players.filter((p) => p.alive)).toHaveLength(1);
    expect(countCards(outcome.state)).toBe(56);
  });

  it('相同种子与策略可复现对局结果', () => {
    const first = runFullSimulation({ playerCount: 4, seed: 777 });
    const second = runFullSimulation({ playerCount: 4, seed: 777 });
    expect(first.winnerId).toBe(second.winnerId);
    expect(first.steps).toBe(second.steps);
    expect(first.state.eventLog.map((e) => e.message)).toEqual(second.state.eventLog.map((e) => e.message));
  });

  it('淘汰玩家不能再执行操作', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    stripType(engine.state, 'defuse');
    setDrawPile(engine.state, [makeCard('bomb'), makeCard('skip')]);
    engine.apply({ type: 'DRAW_CARD', playerId: 'p1' });
    expect(player(engine.state, 'p1').alive).toBe(false);
    const fake = makeCard('skip');
    player(engine.state, 'p1').hand.push(fake);
    const result = engine.apply({ type: 'PLAY_CARD', playerId: 'p1', cardIds: [fake.id] });
    expect(result.ok).toBe(false);
  });

  it('2 至 5 人局各 5 个种子共 20 局均正常结束且卡牌守恒', () => {
    for (const count of [2, 3, 4, 5] as const) {
      for (let seed = 1; seed <= 5; seed += 1) {
        const outcome = runFullSimulation({ playerCount: count, seed: seed * 1000 + count });
        expect(outcome.error).toBeUndefined();
        expect(outcome.finished).toBe(true);
        expect(outcome.state.players.filter((p) => p.alive)).toHaveLength(1);
        expect(countCards(outcome.state)).toBe(56);
      }
    }
  });

  it('真人与模拟玩家混合时，模拟玩家可自动推进直到真人回合', () => {
    const engine = startGame(3);
    clearNopes(engine.state);
    setDrawPile(engine.state, [
      makeCard('skip'),
      makeCard('favor'),
      makeCard('shuffle'),
      makeCard('attack'),
      makeCard('seeFuture'),
      makeCard('cat', 'burger'),
      makeCard('cat', 'fries'),
      makeCard('cat', 'burger'),
      makeCard('skip'),
      makeCard('favor'),
    ]);
    expect(engine.apply({ type: 'DRAW_CARD', playerId: 'p1' }).ok).toBe(true);
    let steps = 0;
    while (engine.state.phase === 'playing' && engine.state.currentPlayerId !== 'p1' && steps < 500) {
      const step = nextBotStep(engine.state);
      expect(step).not.toBeNull();
      const result = engine.apply(step?.action ?? { type: 'DRAW_CARD', playerId: 'p2' });
      expect(result.error).toBeUndefined();
      steps += 1;
    }
    expect(engine.state.currentPlayerId === 'p1' || engine.state.phase === 'finished').toBe(true);
  });

  it('卡牌名称展示与规则一致', () => {
    expect(cardDisplayName({ id: 'x', type: 'cat', cat: 'burger' })).toBe('汉堡猫咪');
    expect(cardDisplayName({ id: 'y', type: 'seeFuture' })).toBe('预见未来（幻觉）');
  });
});
