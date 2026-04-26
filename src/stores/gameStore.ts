import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  GameState, Card, CollectPair, LogEntry, GamePhase,
  Player, TurnSubPhase, VictoryCondition,
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

  // ======== 计算属性 ========

  const phase = computed(() => gameState.value.phase)
  const players = computed(() => gameState.value.players)
  const tableCards = computed(() => gameState.value.tableCards)
  const logs = computed(() => gameState.value.logs)
  const currentPlayer = computed(() => gameState.value.currentPlayer)
  const isMyTurn = computed(() => gameState.value.turnManager.currentPlayer === 0)
  const humanPlayer = computed(() => gameState.value.players[0])
  const discardResetAvailable = computed(() => gameState.value.discardResetAvailable)
  const currentPlayedCard = computed(() => gameState.value.currentPlayedCard)
  const currentFlippedCard = computed(() => gameState.value.currentFlippedCard)
  const currentCollectPairs = computed(() => gameState.value.currentCollectPairs)
  const deckRemaining = computed(() => gameState.value.deck.remaining)
  const isGameEnd = computed(() => gameState.value.isGameEnd())
  const awaitingCollectChoice = computed(() => gameState.value.awaitingCollectChoice)
  const pendingCollectPairs = computed(() => gameState.value.pendingCollectPairs)
  const collectChoiceContext = computed(() => gameState.value.collectChoiceContext)

  // ======== 操作方法 ========

  /** 初始化游戏 */
  function initGame(playerNames: string[], avatars: string[]) {
    gameState.value.initGame(playerNames, avatars)
    selectedCardId.value = null
    turnTimer.value = 30
  }

  /** 选择手牌 */
  function selectCard(cardId: string) {
    if (!isMyTurn.value || isAnimating.value) return
    if (awaitingCollectChoice.value) return // 等待收牌选择时不能选手牌
    selectedCardId.value = selectedCardId.value === cardId ? null : cardId
  }

  /** 出牌 */
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
      await endCurrentTurn()
    }
  }

  /** 继续翻牌流程 */
  async function proceedToFlip() {
    // 翻牌
    animationStep.value = 'flipCard'
    const flipResult = gameState.value.flipCard()
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

    // 结束回合
    await endCurrentTurn()
  }

  /** 结束当前回合，切换到AI */
  async function endCurrentTurn() {
    animationStep.value = 'turnEnd'
    gameState.value.finishTurn()
    await delay(DELAY_TURN_CHANGE)

    // 检查游戏是否结束
    if (gameState.value.phase === GamePhase.Settlement) {
      isAnimating.value = false
      return
    }

    // AI回合
    isAnimating.value = false
    await processAITurns()
  }

  /** AI回合处理 */
  async function processAITurns() {
    while (gameState.value.turnManager.currentPlayer !== 0 && gameState.value.phase === GamePhase.Playing) {
      isAnimating.value = true

      const currentPlayer = gameState.value.players[gameState.value.turnManager.currentPlayer]

      // 如果当前玩家没有手牌，跳过
      if (currentPlayer.hand.length === 0) {
        gameState.value.finishTurn()
        await delay(DELAY_TURN_CHANGE)
        if (gameState.value.phase === GamePhase.Settlement) break
        continue
      }

      // AI思考延时
      const thinkTime = AI_THINK_MIN + Math.random() * (AI_THINK_MAX - AI_THINK_MIN)
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
        const flipResult = gameState.value.flipCard()
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

      if (gameState.value.phase === GamePhase.Settlement) break
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
    // 方法
    initGame,
    selectCard,
    playCard,
    selectCollectPair,
    executeDiscardReset,
    declineDiscardReset,
  }
})
