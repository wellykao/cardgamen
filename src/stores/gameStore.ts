import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  GameState, Card, CollectPair, LogEntry, GamePhase,
  Player, TurnSubPhase, VictoryCondition,
  findValidPairs, canCollect,
} from '@/engine'
import {
  DELAY_AFTER_PLAY, DELAY_COLLECT_ANIMATION,
  DELAY_FLIP_ANIMATION, DELAY_AFTER_FLIP, DELAY_TURN_CHANGE,
  AI_THINK_MIN, AI_THINK_MAX,
} from '@/engine/constants'

export const useGameStore = defineStore('game', () => {
  // 游戏状态实例
  const gameState = ref<GameState>(new GameState())

  // 动画状态
  const isAnimating = ref(false)
  const animationStep = ref('')
  const selectedCardId = ref<string | null>(null)

  // 倒计时
  const turnTimer = ref(30)

  // 联机模式下"我"的座位号（单机模式默认为 0）
  const myPlayerIndex = ref(0)
  const isSinglePlayer = ref(true)

  // ======== 计算属性 ========

  const phase = computed(() => gameState.value.phase)
  const players = computed(() => gameState.value.players)
  const tableCards = computed(() => gameState.value.tableCards)
  const logs = computed(() => gameState.value.logs)
  const currentPlayer = computed(() => gameState.value.currentPlayer)
  const isMyTurn = computed(() => gameState.value.turnManager.currentPlayer === myPlayerIndex.value)
  const humanPlayer = computed(() => gameState.value.players[myPlayerIndex.value])
  const discardResetAvailable = computed(() => gameState.value.discardResetAvailable)
  const currentPlayedCard = computed(() => gameState.value.currentPlayedCard)
  const currentFlippedCard = computed(() => gameState.value.currentFlippedCard)
  const currentCollectPairs = computed(() => gameState.value.currentCollectPairs)
  const deckRemaining = computed(() => gameState.value.deck.remaining)
  const isGameEnd = computed(() => gameState.value.isGameEnd())
  const awaitingCollectChoice = computed(() => gameState.value.awaitingCollectChoice)
  const pendingCollectPairs = computed(() => gameState.value.pendingCollectPairs)
  const collectChoiceContext = computed(() => gameState.value.collectChoiceContext)

  /** 推荐出牌：优先推荐能收牌的，按可得分排序 */
  const recommendedCardId = computed(() => {
    if (!isMyTurn.value || isAnimating.value || awaitingCollectChoice.value) return null
    const hand = humanPlayer.value?.hand || []
    if (hand.length === 0) return null

    // 找出所有能收牌的牌
    const collectable = hand.filter(card => canCollect(card, tableCards.value))

    if (collectable.length > 0) {
      // 按可获得的最高分数排序，推荐得分最高的
      const scored = collectable.map(card => {
        const pairs = findValidPairs(card, tableCards.value)
        const bestPair = pairs.reduce((best, p) => {
          const score = p.playedCard.scoreValue + p.tableCard.scoreValue
          return score > best.score ? { pair: p, score } : best
        }, { pair: pairs[0], score: pairs[0].playedCard.scoreValue + pairs[0].tableCard.scoreValue })
        return { card, score: bestPair.score }
      })
      scored.sort((a, b) => b.score - a.score)
      return scored[0].card.id
    }

    // 不能收牌时，推荐点数接近10的牌（更容易后续凑10）
    // 优先保留高分红色牌，出低分黑色牌
    const sorted = [...hand].sort((a, b) => {
      // 黑色0分牌优先出掉
      if (a.scoreValue === 0 && b.scoreValue > 0) return -1
      if (b.scoreValue === 0 && a.scoreValue > 0) return 1
      // 点数大的优先出（10/J/Q/K容易凑对子）
      return b.points - a.points
    })
    return sorted[0]?.id || null
  })

  // ======== 操作方法 ========

  /** 初始化游戏 */
  function initGame(playerNames: string[], avatars: string[], startPlayerIndex: number = 0, humanIndex: number = 0, singlePlayer: boolean = true, deckSeed?: string, humanIndices?: number[]) {
    gameState.value.initGame(playerNames, avatars, startPlayerIndex, humanIndex, deckSeed, humanIndices)
    myPlayerIndex.value = humanIndex
    isSinglePlayer.value = singlePlayer
    selectedCardId.value = null
    turnTimer.value = 30
  }

  /** 选择手牌 */
  function selectCard(cardId: string) {
    if (!isMyTurn.value || isAnimating.value) return
    if (awaitingCollectChoice.value) return // 等待收牌选择时不能选手牌
    selectedCardId.value = selectedCardId.value === cardId ? null : cardId
  }

  /** 出牌（单机模式用；联机模式由消息驱动，不直接调用） */
  async function playCard(cardId: string) {
    if (!isMyTurn.value || isAnimating.value) return
    if (awaitingCollectChoice.value) return

    isAnimating.value = true
    selectedCardId.value = null

    // 出牌
    const result = gameState.value.playHumanCard(cardId)
    if (!result.success) {
      isAnimating.value = false
      return
    }

    // 出牌停顿
    animationStep.value = 'playCard'
    await delay(DELAY_AFTER_PLAY)

    // 如果需要选择收哪张
    if (result.needsChoice) {
      isAnimating.value = false
      animationStep.value = 'collectChoice'
      return // 等待用户点击桌面牌选择
    }

    // 自动收牌动画
    if (result.pairs.length > 0) {
      animationStep.value = 'collectCard'
      await delay(DELAY_COLLECT_ANIMATION)
    }

    // 继续翻牌流程
    await proceedToFlip()
  }

  /** 人类玩家选择收哪张牌（点击桌面牌） */
  async function selectCollectPair(pairIndex: number) {
    if (!awaitingCollectChoice.value) return

    isAnimating.value = true
    const context = collectChoiceContext.value

    gameState.value.selectCollectPair(pairIndex)
    animationStep.value = 'collectCard'
    await delay(DELAY_COLLECT_ANIMATION)

    if (context === 'play') {
      // 出牌后的选择，继续翻牌
      await proceedToFlip()
    } else if (context === 'flip') {
      // 翻牌后的选择，结束回合
      if (isSinglePlayer.value) {
        await endCurrentTurn()
      } else {
        isAnimating.value = false
      }
    }
  }

  /** 继续翻牌流程（本地玩家调用，联机模式下不结束回合） */
  async function proceedToFlip() {
    // 翻牌（联机模式跳过自动回合结束）
    animationStep.value = 'flipCard'
    const flipResult = gameState.value.flipCard(!isSinglePlayer.value)
    if (flipResult.card) {
      await delay(DELAY_FLIP_ANIMATION)
      await delay(DELAY_AFTER_FLIP)

      // 翻牌后如果需要选择
      if (flipResult.needsChoice) {
        isAnimating.value = false
        animationStep.value = 'collectChoice'
        return // 等待用户选择
      }

      // 翻牌后自动收牌
      if (flipResult.pairs.length > 0) {
        animationStep.value = 'collectFromFlip'
        await delay(DELAY_COLLECT_ANIMATION)
      }
    }

    // 单机模式直接结束回合；联机模式只执行动画，回合切换由网络消息统一驱动
    if (isSinglePlayer.value) {
      await endCurrentTurn()
    } else {
      isAnimating.value = false
    }
  }

  /** 结束当前回合 */
  async function endCurrentTurn(skipFinishTurn = false) {
    animationStep.value = 'turnEnd'
    if (!skipFinishTurn) {
      gameState.value.finishTurn()
    }
    await delay(DELAY_TURN_CHANGE)

    // 检查游戏是否结束
    if ((gameState.value.phase as GamePhase) === GamePhase.Settlement) {
      isAnimating.value = false
      return
    }

    // 结束当前回合后，如果下一位是 AI，自动执行
    isAnimating.value = false
    await processAITurns()
  }

  /** 仅执行回合切换（用于联机模式收到 play 消息后统一推进回合） */
  async function remoteFinishTurn() {
    if ((gameState.value.phase as GamePhase) !== GamePhase.Playing) return
    // 防止重复调用
    if (isAnimating.value) return

    isAnimating.value = true
    animationStep.value = 'turnEnd'
    gameState.value.finishTurn()
    await delay(DELAY_TURN_CHANGE)

    if ((gameState.value.phase as GamePhase) === GamePhase.Settlement) {
      isAnimating.value = false
      return
    }

    isAnimating.value = false
    await processAITurns()
  }

  /** 执行远端玩家的出牌（联机模式） */
  async function playRemoteCard(playerId: number, cardId: string) {
    if (gameState.value.phase !== GamePhase.Playing) return

    isAnimating.value = true
    selectedCardId.value = null

    const result = gameState.value.playRemoteCard(playerId, cardId)
    if (!result.success) {
      isAnimating.value = false
      return
    }

    animationStep.value = 'playCard'
    await delay(DELAY_AFTER_PLAY)

    if (result.needsChoice) {
      const bestIdx = gameState.value.aiSelectBestCollectPair()
      gameState.value.selectCollectPair(bestIdx)
      animationStep.value = 'collectCard'
      await delay(DELAY_COLLECT_ANIMATION)
    } else if (result.pairs.length > 0) {
      animationStep.value = 'collectCard'
      await delay(DELAY_COLLECT_ANIMATION)
    }

    // 远端玩家出牌后执行翻牌，但不结束回合（回合结束由 turn_end 消息统一驱动）
    await proceedToFlipRemote()
  }

  /** 远端玩家翻牌流程（不结束回合） */
  async function proceedToFlipRemote() {
    animationStep.value = 'flipCard'
    const flipResult = gameState.value.flipCard(true)
    if (flipResult.card) {
      await delay(DELAY_FLIP_ANIMATION)
      await delay(DELAY_AFTER_FLIP)

      if (flipResult.needsChoice) {
        const bestIdx = gameState.value.aiSelectBestCollectPair()
        gameState.value.selectCollectPair(bestIdx)
        animationStep.value = 'collectFromFlip'
        await delay(DELAY_COLLECT_ANIMATION)
      } else if (flipResult.pairs.length > 0) {
        animationStep.value = 'collectFromFlip'
        await delay(DELAY_COLLECT_ANIMATION)
      }
    }
    // 动画完成，重置状态（由调用方统一处理回合结束）
    isAnimating.value = false
  }

  /** AI回合处理 */
  async function processAITurns() {
    while (gameState.value.phase === GamePhase.Playing) {
      const currentPlayerIdx = gameState.value.turnManager.currentPlayer
      const currentPlayer = gameState.value.players[currentPlayerIdx]

      // 如果当前玩家是真人（包括自己和其他联机玩家），停止AI自动执行
      if (!currentPlayer.isAI) break

      isAnimating.value = true

      // 如果当前玩家没有手牌，跳过
      if (currentPlayer.hand.length === 0) {
        gameState.value.finishTurn()
        await delay(DELAY_TURN_CHANGE)
        if ((gameState.value.phase as GamePhase) === GamePhase.Settlement) break
        continue
      }

      // AI思考延时（联机模式下减少延时，让游戏更流畅）
      const thinkTime = isSinglePlayer.value
        ? AI_THINK_MIN + Math.random() * (AI_THINK_MAX - AI_THINK_MIN)
        : 500
      await delay(thinkTime)

      const playerId = gameState.value.turnManager.currentPlayer
      const result = gameState.value.playAICard(playerId)

      if (result) {
        animationStep.value = 'playCard'
        await delay(DELAY_AFTER_PLAY)

        // AI出牌后如果需要选择
        if (result.needsChoice) {
          await delay(300)
          const bestIdx = gameState.value.aiSelectBestCollectPair()
          gameState.value.selectCollectPair(bestIdx)
          animationStep.value = 'collectCard'
          await delay(DELAY_COLLECT_ANIMATION)
        } else if (result.pairs.length > 0) {
          animationStep.value = 'collectCard'
          await delay(DELAY_COLLECT_ANIMATION)
        }

        // 翻牌
        animationStep.value = 'flipCard'
        const flipResult = gameState.value.flipCard(!isSinglePlayer.value)
        if (flipResult.card) {
          await delay(DELAY_FLIP_ANIMATION)
          await delay(DELAY_AFTER_FLIP)

          // 翻牌后如果需要选择
          if (flipResult.needsChoice) {
            await delay(300)
            const bestIdx = gameState.value.aiSelectBestCollectPair()
            gameState.value.selectCollectPair(bestIdx)
            animationStep.value = 'collectFromFlip'
            await delay(DELAY_COLLECT_ANIMATION)
          } else if (flipResult.pairs.length > 0) {
            animationStep.value = 'collectFromFlip'
            await delay(DELAY_COLLECT_ANIMATION)
          }
        }
      }

      animationStep.value = 'turnEnd'
      gameState.value.finishTurn()
      await delay(DELAY_TURN_CHANGE)

      if ((gameState.value.phase as GamePhase) === GamePhase.Settlement) break
    }

    isAnimating.value = false
  }

  /** 弃牌重置 */
  function executeDiscardReset() {
    gameState.value.executeDiscardReset()
  }

  /** 拒绝弃牌重置 */
  function declineDiscardReset() {
    gameState.value.declineDiscardReset()
  }

  /** 延时工具 */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  return {
    // 状态
    gameState,
    isAnimating,
    animationStep,
    selectedCardId,
    turnTimer,
    myPlayerIndex,
    isSinglePlayer,
    // 计算属性
    phase,
    players,
    tableCards,
    logs,
    currentPlayer,
    isMyTurn,
    humanPlayer,
    discardResetAvailable,
    currentPlayedCard,
    currentFlippedCard,
    currentCollectPairs,
    deckRemaining,
    isGameEnd,
    awaitingCollectChoice,
    pendingCollectPairs,
    collectChoiceContext,
    recommendedCardId,
    // 方法
    initGame,
    processAITurns,
    selectCard,
    playCard,
    playRemoteCard,
    remoteFinishTurn,
    selectCollectPair,
    executeDiscardReset,
    declineDiscardReset,
  }
})
