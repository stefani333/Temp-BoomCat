import { randomInt, nextRandom } from './rng';
import {
  CAT_NAMES,
  CARD_NAME_OPTIONS,
  type Card,
  type CatName,
  type GameAction,
  type GameState,
  type PendingAction,
  type Player,
} from './types';

export interface BotStep {
  action: GameAction;
}

function aliveOthers(state: GameState, player: Player): Player[] {
  return state.players
    .filter((p) => p.alive && p.id !== player.id)
    .sort((a, b) => a.seat - b.seat);
}

function nextAliveAfter(state: GameState, player: Player): Player | undefined {
  const alive = state.players.filter((p) => p.alive).sort((a, b) => a.seat - b.seat);
  return alive.find((p) => p.seat > player.seat) ?? alive[0];
}

function findCatGroup(hand: Card[], size: number): Card[] | null {
  for (const cat of CAT_NAMES) {
    const cards = hand.filter((c) => c.type === 'cat' && c.cat === cat);
    if (cards.length >= size) return cards.slice(0, size);
  }
  return null;
}

function findFiveDistinctCats(hand: Card[]): Card[] | null {
  const picked: Card[] = [];
  const seen = new Set<CatName>();
  for (const card of hand) {
    if (card.type === 'cat' && card.cat && !seen.has(card.cat)) {
      seen.add(card.cat);
      picked.push(card);
      if (picked.length === 5) return picked;
    }
  }
  return null;
}

function pickRichestTarget(player: Player, others: Player[]): Player | undefined {
  return [...others].sort((a, b) => b.hand.length - a.hand.length)[0];
}

/**
 * 模拟玩家策略：只读取自己的手牌与公开信息，所有操作仍由规则引擎校验。
 */
export function decideBotPlay(state: GameState, player: Player, others: Player[]): GameAction | null {
  const hand = player.hand;
  if (others.length === 0) return null;
  const targetsWithCards = others.filter((p) => p.hand.length > 0);
  const played = state.cardsPlayedThisTurn;

  const attack = hand.find((c) => c.type === 'attack');
  const skip = hand.find((c) => c.type === 'skip');
  const seeFuture = hand.find((c) => c.type === 'seeFuture');
  const favor = hand.find((c) => c.type === 'favor');
  const shuffle = hand.find((c) => c.type === 'shuffle');

  if (state.turnsRemaining > 1) {
    if (attack) {
      return { type: 'PLAY_CARD', playerId: player.id, cardIds: [attack.id] };
    }
    if (skip) {
      return { type: 'PLAY_CARD', playerId: player.id, cardIds: [skip.id] };
    }
  }

  if (played >= 3) return null;

  if (seeFuture && state.drawPile.length >= 3 && played === 0 && nextRandom(state) < 0.45) {
    return { type: 'PLAY_CARD', playerId: player.id, cardIds: [seeFuture.id] };
  }

  const exactTwo = findCatGroup(hand, 2);
  if (exactTwo && played < 2 && targetsWithCards.length > 0 && nextRandom(state) < 0.55) {
    const target = pickRichestTarget(player, targetsWithCards);
    if (target) {
      return {
        type: 'PLAY_CARD',
        playerId: player.id,
        cardIds: exactTwo.map((c) => c.id),
        targetPlayerId: target.id,
      };
    }
  }

  const fiveCats = findFiveDistinctCats(hand);
  if (fiveCats && state.discardPile.length > 0 && played < 2 && nextRandom(state) < 0.7) {
    const discard = state.discardPile[randomInt(state, state.discardPile.length)];
    if (discard) {
      return {
        type: 'PLAY_CARD',
        playerId: player.id,
        cardIds: fiveCats.map((c) => c.id),
        discardCardId: discard.id,
      };
    }
  }

  const exactThree = findCatGroup(hand, 3);
  if (exactThree && played < 2 && targetsWithCards.length > 0 && nextRandom(state) < 0.4) {
    const target = pickRichestTarget(player, targetsWithCards);
    if (target) {
      const nameOptions = CARD_NAME_OPTIONS.filter((option) => option.key !== 'bomb');
      const option = nameOptions[randomInt(state, nameOptions.length)];
      if (option) {
        return {
          type: 'PLAY_CARD',
          playerId: player.id,
          cardIds: exactThree.map((c) => c.id),
          targetPlayerId: target.id,
          namedCardName: option.key,
        };
      }
    }
  }

  if (favor && played < 2 && targetsWithCards.length > 0 && nextRandom(state) < 0.45) {
    const target = pickRichestTarget(player, targetsWithCards);
    if (target) {
      return {
        type: 'PLAY_CARD',
        playerId: player.id,
        cardIds: [favor.id],
        targetPlayerId: target.id,
      };
    }
  }

  if (skip && nextRandom(state) < 0.12) {
    return { type: 'PLAY_CARD', playerId: player.id, cardIds: [skip.id] };
  }

  if (attack && nextRandom(state) < 0.18) {
    return { type: 'PLAY_CARD', playerId: player.id, cardIds: [attack.id] };
  }

  if (shuffle && played === 0 && nextRandom(state) < 0.12) {
    return { type: 'PLAY_CARD', playerId: player.id, cardIds: [shuffle.id] };
  }

  return null;
}

export function decideBotCounter(state: GameState, player: Player, pending: PendingAction): boolean {
  if (pending.kind === 'bomb') return false;
  if (pending.counterStack.length >= 4) return false;
  if (!player.hand.some((c) => c.type === 'nope')) return false;

  const roll = nextRandom(state);
  if (pending.kind === 'favor' || pending.kind === 'comboTwo' || pending.kind === 'comboThree') {
    return roll < (pending.targetPlayerId === player.id ? 0.85 : 0.08);
  }
  if (pending.kind === 'attack') {
    const source = state.players.find((p) => p.id === pending.sourcePlayerId);
    const next = source ? nextAliveAfter(state, source) : undefined;
    return roll < (next?.id === player.id ? 0.6 : 0.05);
  }
  return roll < 0.05;
}

export function chooseBotFavorCard(player: Player): Card | undefined {
  const preferred = player.hand.filter((c) => c.type !== 'defuse');
  const pool = preferred.length > 0 ? preferred : player.hand;
  return pool[0];
}

export function nextBotStep(state: GameState): BotStep | null {
  if (state.phase !== 'playing') return null;
  const pending = state.pending;

  if (pending) {
    switch (pending.awaiting) {
      case 'counter': {
        const responderId = pending.counterQueue[0];
        const responder = state.players.find((p) => p.id === responderId);
        if (!responder?.isBot) return null;
        return {
          action: {
            type: 'RESPOND_COUNTER',
            playerId: responder.id,
            useNope: decideBotCounter(state, responder, pending),
          },
        };
      }
      case 'favorGive': {
        const targetId = pending.targetPlayerId;
        const target = state.players.find((p) => p.id === targetId);
        if (!target?.isBot) return null;
        const card = chooseBotFavorCard(target);
        if (!card) return null;
        return { action: { type: 'CHOOSE_FAVOR_CARD', playerId: target.id, cardId: card.id } };
      }
      case 'bombDecision': {
        const source = state.players.find((p) => p.id === pending.sourcePlayerId);
        if (!source?.isBot) return null;
        const useDefuse = source.hand.some((c) => c.type === 'defuse');
        return { action: { type: 'RESOLVE_BOMB', playerId: source.id, useDefuse } };
      }
      case 'bombInsert': {
        const source = state.players.find((p) => p.id === pending.sourcePlayerId);
        if (!source?.isBot) return null;
        return {
          action: {
            type: 'CHOOSE_BOMB_INSERT',
            playerId: source.id,
            index: randomInt(state, state.drawPile.length + 1),
          },
        };
      }
      case 'seeFutureAck': {
        const source = state.players.find((p) => p.id === pending.sourcePlayerId);
        if (!source?.isBot) return null;
        return { action: { type: 'ACK_SEE_FUTURE', playerId: source.id } };
      }
      default:
        return null;
    }
  }

  const current = state.players.find((p) => p.id === state.currentPlayerId);
  if (!current?.isBot || !current.alive) return null;
  const others = aliveOthers(state, current);
  const play = decideBotPlay(state, current, others);
  if (play) return { action: play };
  return { action: { type: 'DRAW_CARD', playerId: current.id } };
}
