import {
  Card, Player, GamePhase, LogEntry, CollectPair, Rank,
} from './types'
import { PLAYER_COUNT, INITIAL_HAND_SIZE, INITIAL_TABLE_SIZE } from './constants'
import { Deck } from './Deck'
import { TurnManager } from './TurnManager'
import { findValidPairs, canDiscardReset } from './RuleEngine'
import { updateAllScores, checkVictory, generateSettlement, SettlementData, getScoreDiff } from './ScoreEngine'
import { aiSelectCard } from './AIPlayer'

/** 游戏状态机 - 核心控制器 */
export class GameState {
  // 牌组
  readonly deck = new Deck()
  // 回合管理
  readonly turnManager = new TurnManager()

  // 玩家列表
  players: Player[] = []
  // 桌面公共牌
  tableCards: Card[] = []
  // 当前游戏阶段
  phase: GamePhase = GamePhase.Idle
  // 操作日志
  logs: LogEntry[] = []
  // 当前回合作出的牌
  currentPlayedCard: Card | null = null
  // 当前回合翻出的牌
  currentFlippedCard: Card | null = null
  // 当前收牌配对
  currentCollectPairs: CollectPair[] = []
  // 弃牌重置标记
  discardResetAvailable = false
  // 弃牌重置玩家ID
  discardResetPlayerId = -1

  // 等待用户选择收牌（当存在多张可收时）
  awaitingCollectChoice = false
  pendingCollectPairs: CollectPair[] = []
  collectChoiceContext: 'play' | 'flip' | null = null

  private logIdCounter = 0

  /** 初始化游戏 */
  initGame(playerNames: string[], avatars: string[]): void {
    this.phase = GamePhase.Dealing
    this.logs = []
    this.tableCards = []
    this.currentPlayedCard = null
    this.currentFlippedCard = null
    this.currentCollectPairs = []
    this.discardResetAvailable = false

    // 初始化玩家
    this.players = playerNames.map((name, i) => ({
      id: i,
      name,
      avatar: avatars[i] || '',
      hand: [],
      collected: [],
      score: 0,
      bonusScore: 0,
      isAI: i !== 0,
      isReady: true,
      seatIndex: i,
    }))

    // 洗牌发牌
    this.deck.init()
    const hands = this.deck.dealHands()
    this.tableCards = this.deck.dealTableCards()

    // 分配手牌
    for (let i = 0; i < PLAYER_COUNT; i++) {
      this.players[i].hand = hands[i].sort((a, b) => a.rank - b.rank)
    }

    // 回合管理器初始化（0号玩家先出）
    this.turnManager.init(0)
    this.turnManager.setFourthPlayer(3)

    this.addLog(0, 'system', '游戏开始，发牌完成')
    this.addLog(0, 'system', `桌面公共牌：${this.tableCards.map(c => c.display).join(' ')}`)

    // 检查弃牌重置
    this.phase = GamePhase.DiscardCheck
    this.checkDiscardReset()
  }

  /** 检查弃牌重置条件 */
  private checkDiscardReset(): void {
    const humanPlayer = this.players[0]
    if (canDiscardReset(humanPlayer.hand, this.tableCards)) {
      this.discardResetAvailable = true
      this.discardResetPlayerId = 0
      this.addLog(0, 'system', '手牌满足弃牌重置条件，可以选择重发')
    } else {
      this.discardResetAvailable = false
      this.phase = GamePhase.Playing
      this.addLog(0, 'system', '游戏正式开始，请出牌')
    }
  }

  /** 执行弃牌重置 */
  executeDiscardReset(): void {
    this.deck.reset()
    this.deck.init()
    const hands = this.deck.dealHands()
    this.tableCards = this.deck.dealTableCards()

    for (let i = 0; i < PLAYER_COUNT; i++) {
      this.players[i].hand = hands[i].sort((a, b) => a.rank - b.rank)
      this.players[i].collected = []
      this.players[i].score = 0
      this.players[i].bonusScore = 0
    }

    this.discardResetAvailable = false
    this.phase = GamePhase.Playing
    this.addLog(0, 'discardReset', '弃牌重置完成，重新发牌')
    this.addLog(0, 'system', `新桌面公共牌：${this.tableCards.map(c => c.display).join(' ')}`)
  }

  /** 拒绝弃牌重置，继续游戏 */
  declineDiscardReset(): void {
    this.discardResetAvailable = false
    this.phase = GamePhase.Playing
    this.addLog(0, 'system', '玩家选择不重发，游戏继续')
  }

  /** 人类玩家出牌 */
  playHumanCard(cardId: string): { success: boolean; pairs: CollectPair[]; needsChoice: boolean } {
    if (this.phase !== GamePhase.Playing) return { success: false, pairs: [], needsChoice: false }
    if (this.turnManager.currentPlayer !== 0) return { success: false, pairs: [], needsChoice: false }

    const player = this.players[0]
    const cardIndex = player.hand.findIndex(c => c.id === cardId)
    if (cardIndex === -1) return { success: false, pairs: [], needsChoice: false }

    // 从手牌移除
    const card = player.hand.splice(cardIndex, 1)[0]
    return this.executePlayCard(0, card)
  }

  /** AI玩家出牌 */
  playAICard(playerId: number): { card: Card; pairs: CollectPair[]; needsChoice: boolean } | null {
    if (this.phase !== GamePhase.Playing) return null
    if (this.turnManager.currentPlayer !== playerId) return null

    const player = this.players[playerId]
    if (player.hand.length === 0) return null

    const card = aiSelectCard(player.hand, this.tableCards)
    const cardIndex = player.hand.findIndex(c => c.id === card.id)
    player.hand.splice(cardIndex, 1)

    const result = this.executePlayCard(playerId, card)
    return { card, pairs: result.pairs, needsChoice: result.needsChoice }
  }

  /** 执行出牌逻辑 */
  private executePlayCard(playerId: number, card: Card): { success: boolean; pairs: CollectPair[]; needsChoice: boolean } {
    this.currentPlayedCard = card
    this.currentFlippedCard = null
    this.currentCollectPairs = []
    this.pendingCollectPairs = []
    this.awaitingCollectChoice = false
    this.collectChoiceContext = null

    // 放到桌面
    this.tableCards.push(card)

    // 判定收牌
    const pairs = findValidPairs(card, this.tableCards.filter(c => c.id !== card.id))
    this.currentCollectPairs = pairs

    this.addLog(playerId, 'playCard', `${this.players[playerId].name} 出了 ${card.display}`)

    if (pairs.length === 0) {
      this.addLog(playerId, 'collectCard', `${card.display} 无可收牌`)
      this.turnManager.setPlayedCard(card)
      this.turnManager.setCollectFromPlay([])
      return { success: true, pairs: [], needsChoice: false }
    }

    if (pairs.length === 1) {
      // 只有一张可收，自动收
      this.executeCollect(playerId, [pairs[0]])
      this.turnManager.setPlayedCard(card)
      this.turnManager.setCollectFromPlay([pairs[0]])
      return { success: true, pairs: [pairs[0]], needsChoice: false }
    }

    // 多张可收，等待选择
    this.pendingCollectPairs = pairs
    this.awaitingCollectChoice = true
    this.collectChoiceContext = 'play'
    this.addLog(playerId, 'collectCard', `${card.display} 有多张可收，请选择一张`)
    this.turnManager.setPlayedCard(card)
    this.turnManager.setCollectFromPlay([])
    return { success: true, pairs, needsChoice: true }
  }

  /** 翻牌 */
  flipCard(): { card: Card | null; pairs: CollectPair[]; needsChoice: boolean } {
    if (!this.deck.hasCards) {
      // 无牌可翻，回合结束
      this.finishTurn()
      return { card: null, pairs: [], needsChoice: false }
    }

    const playerId = this.turnManager.currentPlayer

    const card = this.deck.flipCard()!
    this.currentFlippedCard = card
    this.currentCollectPairs = []
    this.pendingCollectPairs = []
    this.awaitingCollectChoice = false
    this.collectChoiceContext = null
    this.tableCards.push(card)

    this.addLog(playerId, 'flipCard', `翻出 ${card.display}`)

    // 翻牌后判定
    const pairs = findValidPairs(card, this.tableCards.filter(c => c.id !== card.id))
    this.currentCollectPairs = pairs

    if (pairs.length === 0) {
      this.addLog(playerId, 'collectCard', `${card.display} 无可收牌`)
      this.turnManager.setFlippedCard(card)
      this.turnManager.setCollectFromFlip([])
      return { card, pairs: [], needsChoice: false }
    }

    if (pairs.length === 1) {
      // 只有一张可收，自动收
      this.executeCollect(playerId, [pairs[0]])
      this.turnManager.setFlippedCard(card)
      this.turnManager.setCollectFromFlip([pairs[0]])
      return { card, pairs: [pairs[0]], needsChoice: false }
    }

    // 多张可收，等待选择
    this.pendingCollectPairs = pairs
    this.awaitingCollectChoice = true
    this.collectChoiceContext = 'flip'
    this.addLog(playerId, 'collectCard', `${card.display} 有多张可收，请选择一张`)
    this.turnManager.setFlippedCard(card)
    this.turnManager.setCollectFromFlip([])
    return { card, pairs, needsChoice: true }
  }

  /** 执行收牌 */
  private executeCollect(playerId: number, pairs: CollectPair[]): void {
    const player = this.players[playerId]
    let doubleRedFiveTriggered = false

    for (const pair of pairs) {
      // 从桌面移除被收的牌
      this.tableCards = this.tableCards.filter(c => c.id !== pair.tableCard.id && c.id !== pair.playedCard.id)

      // 加入玩家收取区
      player.collected.push(pair.playedCard, pair.tableCard)

      const typeStr = pair.type === 'sum10' ? '凑10' : '对子'
      this.addLog(
        playerId,
        'collectCard',
        `${player.name} 收牌 [${pair.playedCard.display}+${pair.tableCard.display}] (${typeStr})`
      )

      // 双红5特殊规则：收得红桃5+方块5，其他玩家各扣10分
      if (!doubleRedFiveTriggered &&
          pair.playedCard.rank === Rank.Five && pair.tableCard.rank === Rank.Five &&
          pair.playedCard.isRed && pair.tableCard.isRed) {
        doubleRedFiveTriggered = true
        const penalty = 10
        player.bonusScore = (player.bonusScore || 0) + penalty * (this.players.length - 1)
        for (const other of this.players) {
          if (other.id !== playerId) {
            other.bonusScore = (other.bonusScore || 0) - penalty
          }
        }
        this.addLog(playerId, 'scoreChange', `${player.name} 收得双红5！其他玩家各扣10分`)
      }
    }

    // 更新分数
    updateAllScores(this.players)

    // 双红5触发时，显示所有人的分数变化
    if (doubleRedFiveTriggered) {
      for (const p of this.players) {
        const diff = getScoreDiff(p)
        this.addLog(p.id, 'scoreChange', `${p.name} ${diff >= 0 ? '+' : ''}${diff} (双红5结算)`)
      }
    } else {
      this.addLog(playerId, 'scoreChange', `${player.name} 当前分数 ${player.score}`)
    }
  }

  /** 选择收哪张牌（人类玩家点击桌面牌时调用） */
  selectCollectPair(pairIndex: number): boolean {
    if (!this.awaitingCollectChoice || pairIndex < 0 || pairIndex >= this.pendingCollectPairs.length) {
      return false
    }

    const pair = this.pendingCollectPairs[pairIndex]
    const playerId = this.turnManager.currentPlayer
    this.executeCollect(playerId, [pair])
    this.currentCollectPairs = [pair]

    this.pendingCollectPairs = []
    this.awaitingCollectChoice = false

    return true
  }

  /** AI选择最优的收牌配对 */
  aiSelectBestCollectPair(): number {
    if (!this.awaitingCollectChoice || this.pendingCollectPairs.length === 0) return -1

    // 选择分值最高的配对（含双红5 bonus）
    let bestIndex = 0
    let bestScore = -Infinity
    for (let i = 0; i < this.pendingCollectPairs.length; i++) {
      const pair = this.pendingCollectPairs[i]
      let score = pair.playedCard.scoreValue + pair.tableCard.scoreValue

      // 双红5额外价值：收得后当前玩家+30，其他各-10
      if (this.isDoubleRedFive(pair)) {
        score += 30
      }

      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }
    return bestIndex
  }

  /** 判断是否为双红5配对 */
  private isDoubleRedFive(pair: CollectPair): boolean {
    return pair.playedCard.rank === Rank.Five && pair.tableCard.rank === Rank.Five &&
           pair.playedCard.isRed && pair.tableCard.isRed
  }

  /** 放弃收牌（当选择不合法或超时时，收第一张） */
  autoCollectFirst(): void {
    if (this.awaitingCollectChoice && this.pendingCollectPairs.length > 0) {
      this.selectCollectPair(0)
    }
  }

  /** 结束当前回合 */
  finishTurn(): void {
    const currentPlayerId = this.turnManager.currentPlayer

    this.addLog(currentPlayerId, 'turnChange', `回合结束，轮到下一位玩家`)

    // 切换回合
    this.turnManager.nextTurn()
    this.currentPlayedCard = null
    this.currentFlippedCard = null
    this.currentCollectPairs = []

    // 检查游戏是否结束
    if (this.isGameEnd()) {
      this.phase = GamePhase.Settlement
      this.addLog(0, 'system', '所有牌已打完，游戏结束')
    }
  }

  /** 判断游戏是否结束 */
  isGameEnd(): boolean {
    // 所有玩家手牌为空且牌堆为空
    const allHandsEmpty = this.players.every(p => p.hand.length === 0)
    const deckEmpty = !this.deck.hasCards
    return allHandsEmpty && deckEmpty
  }

  /** 检查胜利 */
  checkVictoryCondition(): { winnerId: number; condition: string } | null {
    return checkVictory(this.players, this.isGameEnd())
  }

  /** 生成结算数据 */
  getSettlement(): SettlementData | null {
    const result = checkVictory(this.players, this.isGameEnd())
    if (!result) return null
    return generateSettlement(this.players, result.condition)
  }

  /** 添加操作日志 */
  addLog(playerId: number, type: LogEntry['type'], message: string, data?: Record<string, unknown>): void {
    this.logs.push({
      id: `log_${++this.logIdCounter}`,
      timestamp: Date.now(),
      type,
      playerId,
      message,
      data,
    })
  }

  /** 获取人类玩家 */
  get humanPlayer(): Player {
    return this.players[0]
  }

  /** 获取当前出牌玩家 */
  get currentPlayer(): Player {
    return this.players[this.turnManager.currentPlayer]
  }
}
