/** 花色枚举 */
export enum Suit {
  Spade = 'spade',     // 黑桃
  Heart = 'heart',     // 红桃
  Diamond = 'diamond', // 方块
  Club = 'club',       // 梅花
}

/** 点数枚举 */
export enum Rank {
  A = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

/** 游戏阶段 */
export enum GamePhase {
  Idle = 'idle',
  Dealing = 'dealing',
  DiscardCheck = 'discardCheck',
  Playing = 'playing',
  Settlement = 'settlement',
}

/** 收牌类型 */
export enum CollectType {
  Sum10 = 'sum10',  // 凑10
  Pair = 'pair',    // 对子
}

/** 回合子阶段 */
export enum TurnSubPhase {
  PlayCard = 'playCard',       // 出手牌
  CollectFromPlay = 'collectFromPlay', // 出牌后判定收牌
  FlipCard = 'flipCard',       // 翻新牌
  CollectFromFlip = 'collectFromFlip', // 翻牌后判定收牌
  TurnEnd = 'turnEnd',         // 回合结束
}

/** 卡牌接口 */
export interface Card {
  id: string
  suit: Suit
  rank: Rank
  points: number       // A=1, 2-9=原值, 10/J/Q/K=10
  scoreValue: number   // 计分值
  isRed: boolean
  display: string      // 显示名 如 "♠A", "♥K"
}

/** 收牌配对 */
export interface CollectPair {
  playedCard: Card
  tableCard: Card
  type: CollectType
}

/** 玩家 */
export interface Player {
  id: number
  name: string
  avatar: string
  hand: Card[]
  collected: Card[]   // 收取的牌
  score: number       // 当前总分
  bonusScore?: number // 特殊规则加减分（如双红5）
  isAI: boolean
  isReady: boolean
  seatIndex: number   // 0-3 座位号
}

/** 操作日志条目 */
export interface LogEntry {
  id: string
  timestamp: number
  type: 'playCard' | 'collectCard' | 'flipCard' | 'scoreChange' | 'turnChange' | 'system' | 'discardReset'
  playerId: number
  message: string
  data?: Record<string, unknown>
}

/** 回合信息 */
export interface TurnInfo {
  currentPlayerId: number
  subPhase: TurnSubPhase
  playedCard: Card | null
  flippedCard: Card | null
  collectPairs: CollectPair[]
}

/** 房间信息 */
export interface RoomInfo {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
}

/** 动画步骤 */
export interface AnimStep {
  action: string
  delay: number
  data?: Record<string, unknown>
}

/** 胜利条件 */
export enum VictoryCondition {
  Score240 = 'score240',       // 达到240分直接胜利
  Score0 = 'score0',           // 最终0分直接胜利
  HighestScore = 'highestScore', // 常规分高者胜
}
