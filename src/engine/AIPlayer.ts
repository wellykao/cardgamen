import { Card, CollectPair, Player } from './types'
import { findValidPairs, canCollect } from './RuleEngine'

/**
 * AI玩家决策引擎
 * 贪心策略：优先收取高分红色牌，其次凑10，无匹配时打出最低分手牌
 */

/** AI选择出哪张手牌 */
export function aiSelectCard(hand: Card[], tableCards: Card[]): Card {
  // 1. 找出所有能收牌的手牌
  const collectableCards = hand.filter(card => canCollect(card, tableCards))

  if (collectableCards.length > 0) {
    // 2. 选择能收到最高分组合的牌
    let bestCard = collectableCards[0]
    let bestScore = 0

    for (const card of collectableCards) {
      const pairs = findValidPairs(card, tableCards)
      const totalScore = pairs.reduce((sum, pair) => {
        return sum + pair.playedCard.scoreValue + pair.tableCard.scoreValue
      }, 0)

      if (totalScore > bestScore) {
        bestScore = totalScore
        bestCard = card
      }
    }

    return bestCard
  }

  // 3. 无牌可收时，打出最低分的牌
  const sortedHand = [...hand].sort((a, b) => a.scoreValue - b.scoreValue)
  return sortedHand[0]
}

/** AI模拟出牌（返回选中的牌和判定结果） */
export function aiPlayCard(
  player: Player,
  tableCards: Card[]
): { card: Card; pairs: CollectPair[] } {
  const card = aiSelectCard(player.hand, tableCards)
  const pairs = findValidPairs(card, tableCards)
  return { card, pairs }
}

/** AI模拟翻牌后判定 */
export function aiCollectFromFlip(
  flippedCard: Card,
  tableCards: Card[]
): CollectPair[] {
  return findValidPairs(flippedCard, tableCards)
}
