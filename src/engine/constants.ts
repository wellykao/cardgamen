import { Suit, Rank } from './types'

/** 游戏常量配置 */

// 每人初始手牌数
export const INITIAL_HAND_SIZE = 6

// 桌面初始公共牌数
export const INITIAL_TABLE_SIZE = 4

// 玩家总数
export const PLAYER_COUNT = 4

// 全局总分
export const TOTAL_SCORE = 240

// 基准分
export const BASE_SCORE = 60

// 出牌后停顿时间（毫秒）
export const DELAY_AFTER_PLAY = 700

// 收牌动画时间（毫秒）
export const DELAY_COLLECT_ANIMATION = 500

// 翻牌动画时间（毫秒）
export const DELAY_FLIP_ANIMATION = 600

// 翻牌后停顿时间（毫秒）
export const DELAY_AFTER_FLIP = 400

// 回合切换停顿时间（毫秒）
export const DELAY_TURN_CHANGE = 500

// AI思考时间范围（毫秒）
export const AI_THINK_MIN = 800
export const AI_THINK_MAX = 1500

// 出牌倒计时（秒）
export const TURN_TIMEOUT = 30

// 52张牌 - 花色和点数的映射
export const ALL_SUITS: Suit[] = [Suit.Spade, Suit.Heart, Suit.Diamond, Suit.Club]
export const ALL_RANKS: Rank[] = [
  Rank.A, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King,
]

/** 获取牌的点数（用于凑10判定） */
export function getCardPoints(rank: Rank): number {
  if (rank === Rank.A) return 1
  if (rank >= Rank.Two && rank <= Rank.Nine) return rank as number
  // 10, J, Q, K = 10点
  return 10
}

/** 获取牌的计分值 */
export function getCardScoreValue(suit: Suit, rank: Rank): number {
  // A的计分
  if (rank === Rank.A) {
    if (suit === Suit.Club) return 0        // 梅花A = 0
    if (suit === Suit.Spade) return 30      // 黑桃A = 30
    return 20                               // 红桃A/方块A = 20
  }

  const isRed = suit === Suit.Heart || suit === Suit.Diamond

  // 红色牌
  if (isRed) {
    if (rank >= Rank.Two && rank <= Rank.Eight) return rank as number // 红2~红8 = 牌面分
    if (rank >= Rank.Nine) return 10                                    // 红9/10/J/Q/K = 10
  }

  // 黑色牌：仅黑桃A计分（已上面处理），其余0分
  return 0
}

/** 是否红色牌 */
export function isRedSuit(suit: Suit): boolean {
  return suit === Suit.Heart || suit === Suit.Diamond
}

/** 点数显示名 */
export function getRankDisplay(rank: Rank): string {
  const map: Record<number, string> = {
    [Rank.A]: 'A',
    [Rank.Two]: '2',
    [Rank.Three]: '3',
    [Rank.Four]: '4',
    [Rank.Five]: '5',
    [Rank.Six]: '6',
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: '10',
    [Rank.Jack]: 'J',
    [Rank.Queen]: 'Q',
    [Rank.King]: 'K',
  }
  return map[rank] || String(rank)
}

/** 花色显示符号 */
export function getSuitSymbol(suit: Suit): string {
  const map: Record<string, string> = {
    [Suit.Spade]: '♠',
    [Suit.Heart]: '♥',
    [Suit.Diamond]: '♦',
    [Suit.Club]: '♣',
  }
  return map[suit] || '?'
}

/** 牌的唯一ID */
export function getCardId(suit: Suit, rank: Rank): string {
  return `${suit}_${rank}`
}

/** SVG牌面文件名映射 */
export function getCardFileName(suit: Suit, rank: Rank): string {
  const suitMap: Record<string, string> = {
    [Suit.Spade]: 'S',
    [Suit.Heart]: 'H',
    [Suit.Diamond]: 'D',
    [Suit.Club]: 'C',
  }
  const rankMap: Record<number, string> = {
    [Rank.A]: 'A',
    [Rank.Two]: '2',
    [Rank.Three]: '3',
    [Rank.Four]: '4',
    [Rank.Five]: '5',
    [Rank.Six]: '6',
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: 'T',
    [Rank.Jack]: 'J',
    [Rank.Queen]: 'Q',
    [Rank.King]: 'K',
  }
  return `${rankMap[rank]}${suitMap[suit]}.svg`
}
