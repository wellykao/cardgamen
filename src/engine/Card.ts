import { Suit, Rank, Card } from './types'
import { getCardPoints, getCardScoreValue, isRedSuit, getRankDisplay, getSuitSymbol, getCardId } from './constants'

/** 创建一张卡牌 */
export function createCard(suit: Suit, rank: Rank): Card {
  return {
    id: getCardId(suit, rank),
    suit,
    rank,
    points: getCardPoints(rank),
    scoreValue: getCardScoreValue(suit, rank),
    isRed: isRedSuit(suit),
    display: `${getSuitSymbol(suit)}${getRankDisplay(rank)}`,
  }
}

/** 创建完整52张牌组 */
export function createFullDeck(): Card[] {
  const cards: Card[] = []
  const suits = [Suit.Spade, Suit.Heart, Suit.Diamond, Suit.Club]
  const ranks = [
    Rank.A, Rank.Two, Rank.Three, Rank.Four, Rank.Five,
    Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
    Rank.Jack, Rank.Queen, Rank.King,
  ]
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createCard(suit, rank))
    }
  }
  return cards
}

/** 根据ID查找卡牌信息（用于从序列化数据恢复） */
export function parseCardId(id: string): { suit: Suit; rank: Rank } | null {
  const parts = id.split('_')
  if (parts.length !== 2) return null
  const suit = parts[0] as Suit
  const rank = parseInt(parts[1]) as Rank
  if (!Object.values(Suit).includes(suit)) return null
  if (!Object.values(Rank).includes(rank)) return null
  return { suit, rank }
}
