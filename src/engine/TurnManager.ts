import { Player, TurnInfo, TurnSubPhase, Card, CollectPair } from './types'
import { PLAYER_COUNT } from './constants'

/**
 * 回合管理器
 * 管理出牌顺序、权限锁定、回合流转
 */
export class TurnManager {
  private currentPlayerIndex = 0
  private _turnCount = 0
  private _subPhase: TurnSubPhase = TurnSubPhase.PlayCard
  private _playedCard: Card | null = null
  private _flippedCard: Card | null = null
  private _collectPairs: CollectPair[] = []
  private _fourthPlayerSeatIndex = 3  // 第4个出牌的玩家

  /** 初始化回合 */
  init(startPlayerIndex: number = 0): void {
    this.currentPlayerIndex = startPlayerIndex
    this._turnCount = 0
    this._subPhase = TurnSubPhase.PlayCard
    this._playedCard = null
    this._flippedCard = null
    this._collectPairs = []
  }

  /** 获取当前回合信息 */
  getTurnInfo(): TurnInfo {
    return {
      currentPlayerId: this.currentPlayerIndex,
      subPhase: this._subPhase,
      playedCard: this._playedCard,
      flippedCard: this._flippedCard,
      collectPairs: [...this._collectPairs],
    }
  }

  /** 获取当前玩家索引 */
  get currentPlayer(): number {
    return this.currentPlayerIndex
  }

  /** 获取回合计数 */
  get turnCount(): number {
    return this._turnCount
  }

  /** 获取当前子阶段 */
  get subPhase(): TurnSubPhase {
    return this._subPhase
  }

  /** 当前是否是第4个出牌的玩家 */
  get isFourthPlayer(): boolean {
    return this.currentPlayerIndex === this._fourthPlayerSeatIndex
  }

  /** 判断指定玩家是否是当前出牌者 */
  isCurrentPlayer(playerIndex: number): boolean {
    return playerIndex === this.currentPlayerIndex
  }

  /** 设置出牌 */
  setPlayedCard(card: Card): void {
    this._playedCard = card
    this._subPhase = TurnSubPhase.CollectFromPlay
  }

  /** 设置出牌后收牌结果 */
  setCollectFromPlay(pairs: CollectPair[]): void {
    this._collectPairs = pairs
    this._subPhase = TurnSubPhase.FlipCard
  }

  /** 设置翻牌 */
  setFlippedCard(card: Card): void {
    this._flippedCard = card
    this._subPhase = TurnSubPhase.CollectFromFlip
  }

  /** 设置翻牌后收牌结果 */
  setCollectFromFlip(pairs: CollectPair[]): void {
    this._collectPairs = pairs
    this._subPhase = TurnSubPhase.TurnEnd
  }

  /** 切换到下一个玩家 */
  nextTurn(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % PLAYER_COUNT
    this._turnCount++
    this._subPhase = TurnSubPhase.PlayCard
    this._playedCard = null
    this._flippedCard = null
    this._collectPairs = []
  }

  /** 获取下一个玩家索引（不切换） */
  peekNextPlayer(): number {
    return (this.currentPlayerIndex + 1) % PLAYER_COUNT
  }

  /** 设置第4个出牌的玩家座位 */
  setFourthPlayer(seatIndex: number): void {
    this._fourthPlayerSeatIndex = seatIndex
  }
}
