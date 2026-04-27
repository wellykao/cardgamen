<template>
  <div class="game-view w-screen h-screen relative">
    <!-- 联机状态指示器 -->
    <div v-if="isMultiplayer" class="absolute top-2 right-2 z-20 flex items-center gap-2">
      <div class="glass-panel px-2 py-1 text-xs flex items-center gap-1.5">
        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span class="text-white/60">联机中</span>
        <span class="text-white/40">|</span>
        <span class="text-gold-light">{{ mpStore.myPlayerId ? mpStore.sortedPlayers.find(p => p.user_id === mpStore.myPlayerId)?.name : '' }}</span>
      </div>
    </div>

    <!-- 弃牌重置提示 -->
    <BaseModal v-model="showDiscardModal" title="弃牌重置" :closeable="false">
      <div class="text-center py-4">
        <div class="text-4xl mb-4">🔄</div>
        <p class="text-lg mb-2">你的手牌满足弃牌重置条件！</p>
        <p class="text-white/50 text-sm mb-6">可以选择重新发牌或继续游戏</p>
        <div class="flex justify-center gap-4">
          <BaseButton variant="gold" @click="handleDiscardReset">重新发牌</BaseButton>
          <BaseButton variant="dark" @click="handleDeclineDiscard">继续游戏</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 规则弹窗 -->
    <BaseModal v-model="showRules" title="游戏规则">
      <div class="space-y-4 text-sm text-white/80 max-h-[60vh] overflow-y-auto py-2">
        <div class="glass-panel p-3">
          <h3 class="text-gold-light font-bold mb-2">📋 基本规则</h3>
          <ul class="space-y-1 text-white/70">
            <li>• 52张牌，4人对局，顺时针出牌</li>
            <li>• A=1点，2-9=原点数，10/J/Q/K=10点</li>
            <li>• 每人开局6张手牌，桌面4张公共牌</li>
          </ul>
        </div>
        <div class="glass-panel p-3">
          <h3 class="text-gold-light font-bold mb-2">🃏 收牌规则</h3>
          <ul class="space-y-1 text-white/70">
            <li>• <span class="text-green-400">A-9</span>：两张相加=10可回收</li>
            <li>• <span class="text-amber-400">10/J/Q/K</span>：必须同点对子回收</li>
          </ul>
        </div>
        <div class="glass-panel p-3">
          <h3 class="text-gold-light font-bold mb-2">💎 计分规则</h3>
          <ul class="space-y-1 text-white/70">
            <li>• 黑桃A=30 红桃A/方块A=20 梅花A=0</li>
            <li>• 红2-8=牌面分 红9/10/J/Q/K=10分</li>
            <li>• 其余黑色牌0分 总分240 基准60</li>
          </ul>
        </div>
      </div>
    </BaseModal>

    <!-- 设置弹窗 -->
    <BaseModal v-model="showSettings" title="设置">
      <SettingsPanel />
    </BaseModal>

    <!-- 游戏桌面 -->
    <GameTable
      v-if="gameStore.players.length === 4"
      :players="gameStore.players"
      :table-cards="gameStore.tableCards"
      :logs="gameStore.logs"
      :current-player-index="gameStore.currentPlayer?.id ?? 0"
      :phase="gameStore.phase"
      :is-animating="gameStore.isAnimating"
      :selected-card-id="gameStore.selectedCardId"
      :show-discard-reset="false"
      :deck-remaining="gameStore.deckRemaining"
      :highlighted-card-ids="highlightedCardIds"
      :turn-timer-value="timer.timeLeft.value"
      :awaiting-collect-choice="gameStore.awaitingCollectChoice"
      :recommended-card-id="gameStore.recommendedCardId"
      :is-multiplayer="isMultiplayer"
      :my-player-index="gameStore.myPlayerIndex"
      @select-card="handleSelectCard"
      @play-card="handlePlayCard"
      @discard-reset="handleDiscardReset"
      @decline-discard="handleDeclineDiscard"
    />

    <!-- 加载中 -->
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-center">
        <div class="w-10 h-10 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-white/50 text-sm">正在加载牌桌...</p>
      </div>
    </div>

    <!-- 左上角功能按钮组 -->
    <div class="absolute top-2 left-2 z-20 flex gap-2">
      <button class="glass-panel px-2.5 py-1.5 text-white/60 hover:text-white/90 cursor-pointer text-xs" @click="showRules = true">
        📖 规则
      </button>
      <button class="glass-panel px-2.5 py-1.5 text-white/60 hover:text-white/90 cursor-pointer text-xs" @click="showSettings = true">
        ⚙️ 设置
      </button>
      <button v-if="isMultiplayer" class="glass-panel px-2.5 py-1.5 text-white/60 hover:text-[#ff3366] cursor-pointer text-xs" @click="handleLeaveGame">
        🚪 离开
      </button>
    </div>

    <!-- 回合提示浮层 -->
    <Transition name="fade">
      <div v-if="showTurnHint" class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center pointer-events-none">
        <div class="glass-panel px-8 py-4 text-gold-light text-xl font-bold animate-fade-in">
          {{ turnHintText }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { useGameTimer } from '@/composables/useGameTimer'
import { GamePhase } from '@/engine'
import GameTable from '@/components/game/GameTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SettingsPanel from '@/components/common/SettingsPanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()
const mpStore = useMultiplayerStore()
const timer = useGameTimer()

const showRules = ref(false)
const showSettings = ref(false)
const showDiscardModal = ref(false)
const showTurnHint = ref(false)
const turnHintText = ref('')

const isMultiplayer = computed(() => mpStore.isInRoom)

const highlightedCardIds = computed(() => {
  const ids: string[] = []
  if (gameStore.currentCollectPairs.length > 0) {
    for (const pair of gameStore.currentCollectPairs) {
      ids.push(pair.playedCard.id, pair.tableCard.id)
    }
  }
  return ids
})

watch(() => gameStore.discardResetAvailable, (val) => {
  if (val) showDiscardModal.value = true
})

watch(() => gameStore.isMyTurn, (myTurn) => {
  if (myTurn && gameStore.phase === GamePhase.Playing) {
    timer.start(30)
    showTurnHintTemp('轮到你出牌')
  } else {
    timer.stop()
  }
})

watch(() => gameStore.phase, (phase) => {
  if (phase === GamePhase.Settlement) {
    timer.stop()
    setTimeout(() => router.push('/settlement'), 1500)
  }
})

// 监听联机游戏动作
let unwatchMoves: (() => void) | null = null

function showTurnHintTemp(text: string) {
  turnHintText.value = text
  showTurnHint.value = true
  setTimeout(() => showTurnHint.value = false, 1200)
}

function handleSelectCard(cardId: string) {
  gameStore.selectCard(cardId)
}

let isSendingMove = false

async function handlePlayCard(cardId: string) {
  if (isSendingMove) return
  timer.stop()

  // 联机模式：只发送消息，不执行本地游戏逻辑（所有逻辑由消息统一驱动）
  if (isMultiplayer.value) {
    isSendingMove = true
    gameStore.selectedCardId = null  // 清除选中状态
    try {
      await mpStore.sendMove('play', cardId)
    } finally {
      // 1秒后重置，防止快速重复点击
      setTimeout(() => { isSendingMove = false }, 1000)
    }
    return
  }

  // 单机模式：正常执行
  await gameStore.playCard(cardId)
}

function handleDiscardReset() {
  showDiscardModal.value = false
  gameStore.executeDiscardReset()
  if (isMultiplayer.value) mpStore.sendMove('discard_reset', undefined, undefined, true)
}

function handleDeclineDiscard() {
  showDiscardModal.value = false
  gameStore.declineDiscardReset()
  if (isMultiplayer.value) mpStore.sendMove('discard_reset', undefined, undefined, false)
}

function handleLeaveGame() {
  mpStore.leaveRoom()
  router.push('/lobby')
}

// 记录已处理的 move id，防止重复处理
const processedMoveIds = new Set<string>()

onMounted(async () => {
  if (isMultiplayer.value) {
    // 联机模式：使用房间玩家信息
    const names = mpStore.sortedPlayers.map(p => p.name)
    const avatars = mpStore.sortedPlayers.map(p => p.avatar)
    while (names.length < 4) {
      names.push(`电脑${names.length}`)
      avatars.push('')
    }

    // 获取房间种子，确保所有客户端发牌一致
    let deckSeed: string | undefined
    const snapshot = await mpStore.loadLatestSnapshot(mpStore.currentRoom!.id)
    if (snapshot.deckSeed) deckSeed = snapshot.deckSeed

    // 所有真人玩家的座位索引（基于 room_players 的 seat_index）
    const humanIndices = mpStore.sortedPlayers.map(p => p.seat_index)

    // 传入 mySeatIndex 作为 humanIndex，并标记为非单机模式
    gameStore.initGame(names, avatars, 0, mpStore.mySeatIndex, false, deckSeed, humanIndices)

    // 监听游戏动作（包括自己的，用于统一驱动状态变更）
    unwatchMoves = mpStore.$subscribe((mutation, state) => {
      const moves = state.gameMoves
      if (moves.length > 0) {
        const lastMove = moves[moves.length - 1]
        // 跳过已处理的动作
        if (processedMoveIds.has(lastMove.id)) return
        processedMoveIds.add(lastMove.id)

        console.log('[Game] 收到联机动作:', lastMove)
        if (lastMove.move_type === 'play' && lastMove.card_id) {
          // 所有客户端统一执行完整的出牌+翻牌+回合结束流程
          gameStore.playRemoteCard(lastMove.player_index, lastMove.card_id).then(() => {
            gameStore.remoteFinishTurn()
          })
        }
      }
    })
  } else {
    // 单机模式
    const names = lobbyStore.getGamePlayerNames()
    const avatars = lobbyStore.getGamePlayerAvatars()
    gameStore.initGame(names, avatars)
  }
})

onUnmounted(() => {
  if (unwatchMoves) unwatchMoves()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
