import { Card, CollectPair, CollectType, Rank } from './types'

/**
 * 收牌规则引擎
 * 纯函数式设计，无副作用
 */

/** 判断两张牌是否可以凑10回收 */
function canSum10(card1: Card, card2: Card): boolean {
  // 10/J/Q/K禁止凑10，只能对子回收
  if (card1.points === 10 || card2.points === 10) return false
  return card1.points + card2.points === 10
}

/** 判断两张牌是否为同点对子（仅10/J/Q/K） */
function isValuePair(card1: Card, card2: Card): boolean {
  // 对子仅限10/J/Q/K（points=10的点数牌）
  if (card1.points !== 10 || card2.points !== 10) return false
  return card1.rank === card2.rank
}

/**
 * 查找打出的牌与桌面牌的所有合法配对
 * @param playedCard 打出的牌（手牌或翻出的牌）
 * @param tableCards 桌面上的牌
 * @returns 所有合法配对列表
 */
export function findValidPairs(playedCard: Card, tableCards: Card[]): CollectPair[] {
  const pairs: CollectPair[] = []

  for (const tableCard of tableCards) {
    // 检查凑10
    if (canSum10(playedCard, tableCard)) {
      pairs.push({
        playedCard,
        tableCard,
        type: CollectType.Sum10,
      })
    }
    // 检查同点对子
    else if (isValuePair(playedCard, tableCard)) {
      pairs.push({
        playedCard,
        tableCard,
        type: CollectType.Pair,
      })
    }
  }

  return pairs
}

/**
 * 判断打出某张牌后是否能收牌
 */
export function canCollect(playedCard: Card, tableCards: Card[]): boolean {
  return findValidPairs(playedCard, tableCards).length > 0
}

/**
 * 判断是否是10/J/Q/K点数牌（用于规则限制）
 */
export function isTenPointCard(card: Card): boolean {
  return card.points === 10
}

/**
 * 判断手牌是否全黑（弃牌重置条件1）
 */
export function isAllBlack(hand: Card[]): boolean {
  return hand.length > 0 && hand.every(card => !card.isRed)
}

/**
 * 判断手牌+桌面是否存在四张同点数（弃牌重置条件2）
 */
export function hasFourOfAKind(hand: Card[], tableCards: Card[]): boolean {
  const allCards = [...hand, ...tableCards]
  const rankCounts = new Map<Rank, number>()

  for (const card of allCards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1)
  }

  for (const count of rankCounts.values()) {
    if (count >= 4) return true
  }

  return false
}

/**
 * 判断是否可以弃牌重置
 */
export function canDiscardReset(hand: Card[], tableCards: Card[]): boolean {
  return isAllBlack(hand) || hasFourOfAKind(hand, tableCards)
}
