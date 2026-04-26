import { Card, Player, VictoryCondition } from './types'
import { TOTAL_SCORE, BASE_SCORE } from './constants'

/**
 * 计分引擎
 */

/** 计算一组牌的总分 */
export function calculateCardsScore(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + card.scoreValue, 0)
}

/** 更新玩家分数（根据收取的牌重新计算） */
export function updatePlayerScore(player: Player): number {
  player.score = calculateCardsScore(player.collected) + (player.bonusScore || 0)
  return player.score
}

/** 批量更新所有玩家分数 */
export function updateAllScores(players: Player[]): void {
  for (const player of players) {
    updatePlayerScore(player)
  }
}

/** 计算玩家相对于基准分的加减分 */
export function getScoreDiff(player: Player): number {
  return player.score - BASE_SCORE
}

/**
 * 判定胜利条件
 * @param players 所有玩家
 * @param isGameEnd 游戏是否结束（所有牌打完）
 * @returns 胜利者ID和胜利条件，null表示未决出
 */
export function checkVictory(
  players: Player[],
  isGameEnd: boolean
): { winnerId: number; condition: VictoryCondition } | null {
  // 条件1：某玩家达到240分直接胜利
  for (const player of players) {
    if (player.score >= TOTAL_SCORE) {
      return { winnerId: player.id, condition: VictoryCondition.Score240 }
    }
  }

  // 游戏结束时判定
  if (isGameEnd) {
    // 条件2：某玩家最终0分直接胜利
    for (const player of players) {
      if (player.score === 0) {
        return { winnerId: player.id, condition: VictoryCondition.Score0 }
      }
    }

    // 条件3：常规结算分高者胜
    let maxScore = -1
    let winnerId = -1
    for (const player of players) {
      if (player.score > maxScore) {
        maxScore = player.score
        winnerId = player.id
      }
    }
    return { winnerId, condition: VictoryCondition.HighestScore }
  }

  return null
}

/**
 * 生成结算数据
 */
export interface SettlementData {
  players: Array<{
    id: number
    name: string
    avatar: string
    score: number
    diff: number
    collected: Card[]
    rank: number
  }>
  winnerId: number
  victoryCondition: VictoryCondition
}

export function generateSettlement(
  players: Player[],
  victoryCondition: VictoryCondition
): SettlementData {
  const winnerId = victoryCondition === VictoryCondition.Score240
    ? players.find(p => p.score >= TOTAL_SCORE)!.id
    : victoryCondition === VictoryCondition.Score0
      ? players.find(p => p.score === 0)!.id
      : players.reduce((a, b) => a.score > b.score ? a : b).id

  // 结算分数：一分未得者按240分计
  const settlementScore = (p: Player) =>
    victoryCondition === VictoryCondition.Score0 && p.score === 0 ? TOTAL_SCORE : p.score

  // 计算排名（使用结算分数）
  const sorted = [...players].sort((a, b) => settlementScore(b) - settlementScore(a))
  const rankMap = new Map<number, number>()
  sorted.forEach((p, i) => rankMap.set(p.id, i + 1))

  return {
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: settlementScore(p),
      diff: settlementScore(p) - BASE_SCORE,
      collected: [...p.collected],
      rank: rankMap.get(p.id)!,
    })),
    winnerId,
    victoryCondition,
  }
}
