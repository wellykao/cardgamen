<template>
  <div class="game-view w-screen h-screen relative">
    <!-- 新手引导 -->
    <div v-if="showTutorial" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="neon-panel p-6 w-full max-w-md mx-4 animate-fade-in max-h-[85vh] overflow-y-auto border border-[#00d4ff]/20">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-black text-[#ffd700] text-glow-gold">🎮 游戏指南</h2>
          <button class="text-white/40 hover:text-white cursor-pointer text-lg transition-colors" @click="showTutorial = false">✕</button>
        </div>

        <!-- 步骤指示器 -->
        <div class="flex gap-2 mb-5">
          <div
            v-for="(step, i) in tutorialSteps"
            :key="i"
            class="flex-1 h-1.5 rounded-full transition-all duration-300"
            :class="tutorialStep >= i ? 'bg-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'bg-white/10'"
          />
        </div>

        <!-- 当前步骤内容 -->
        <div class="mb-6">
          <div class="text-3xl mb-3 text-center">{{ tutorialSteps[tutorialStep].icon }}</div>
          <h3 class="text-lg font-black text-white mb-2 text-center tracking-wide">{{ tutorialSteps[tutorialStep].title }}</h3>
          <p class="text-white/60 text-sm leading-relaxed whitespace-pre-line">{{ tutorialSteps[tutorialStep].desc }}</p>
        </div>

        <!-- 按钮 -->
        <div class="flex justify-between gap-3">
          <button
            v-if="tutorialStep > 0"
            class="px-5 py-2.5 rounded-xl bg-[#1a1a2e] text-white/60 hover:text-white hover:bg-[#2a2a3e] border border-white/10 cursor-pointer text-sm font-bold transition-all"
            @click="tutorialStep--"
          >
            上一步
          </button>
          <div v-else />
          <button
            v-if="tutorialStep < tutorialSteps.length - 1"
            class="px-6 py-2.5 rounded-xl btn-gold cursor-pointer text-sm font-black"
            @click="tutorialStep++"
          >
            下一步
          </button>
          <button
            v-else
            class="px-6 py-2.5 rounded-xl btn-gold cursor-pointer text-sm font-black"
            @click="showTutorial = false"
          >
            开始游戏！
          </button>
        </div>

        <!-- 跳过 -->
        <button
          class="w-full mt-3 text-white/20 hover:text-white/40 text-xs cursor-pointer transition-colors font-bold"
          @click="showTutorial = false"
        >
          跳过教程
        </button>
      </div>
    </div>

    <!-- 弃牌重置提示 -->
    <BaseModal v-model="showDiscardModal" title="弃牌重置" :closeable="false">
      <div class="text-center py-4">
        <div class="text-4xl mb-4">🔄</div>
        <p class="text-lg mb-2 font-bold text-white/80">你的手牌满足弃牌重置条件！</p>
        <p class="text-white/40 text-sm mb-6">可以选择重新发牌或继续游戏</p>
        <div class="flex justify-center gap-4">
          <BaseButton variant="gold" @click="handleDiscardReset">重新发牌</BaseButton>
          <BaseButton variant="dark" @click="handleDeclineDiscard">继续游戏</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 规则弹窗 -->
    <BaseModal v-model="showRules" title="游戏规则">
      <div class="space-y-4 text-sm text-white/70 max-h-[60vh] overflow-y-auto py-2">
        <div class="neon-panel p-3 border border-[#00d4ff]/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">📋 基本规则</h3>
          <ul class="space-y-1 text-white/70">
            <li>• 52张牌，4人对局，顺时针出牌</li>
            <li>• A=1点，2-9=原点数，10/J/Q/K=10点</li>
            <li>• 每人开局6张手牌，桌面4张公共牌</li>
          </ul>
        </div>

        <div class="neon-panel p-3 border border-[#ff3366]/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">🃏 收牌规则</h3>
          <ul class="space-y-1 text-white/60">
            <li>• <span class="text-[#39ff14]">A-9</span>：两张相加=10可回收</li>
            <li>• <span class="text-[#ffaa00]">10/J/Q/K</span>：必须同点对子回收</li>
            <li>• 禁止多张组合，仅限两张</li>
          </ul>
        </div>

        <div class="neon-panel p-3 border border-[#00d4ff]/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">🔄 回合流程</h3>
          <ol class="space-y-1 text-white/60 list-decimal list-inside">
            <li>出1张手牌 → 判定收牌</li>
            <li>翻1张新牌 → 再判定</li>
            <li>回合结束，轮到下家</li>
          </ol>
        </div>

        <div class="neon-panel p-3 border border-[#ffd700]/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">💎 计分规则</h3>
          <ul class="space-y-1 text-white/60">
            <li>• 黑桃A=<span class="text-[#ffd700] font-black">30</span> 红桃A/方块A=<span class="text-[#ffd700]">20</span> 梅花A=0</li>
            <li>• 红2-8=牌面分 红9/10/J/Q/K=10分</li>
            <li>• 其余黑色牌0分 总分240 基准60</li>
          </ul>
        </div>

        <div class="neon-panel p-3 border border-[#39ff14]/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">🏆 胜利条件</h3>
          <ul class="space-y-1 text-white/60">
            <li>• 达到240分直接胜利</li>
            <li>• 最终0分直接胜利</li>
            <li>• 常规结算分高者胜</li>
          </ul>
        </div>

        <div class="neon-panel p-3 border border-white/10">
          <h3 class="text-[#ffd700] font-black mb-2 flex items-center gap-2 text-glow-gold">🎲 弃牌重置</h3>
          <ul class="space-y-1 text-white/60">
            <li>• 6张手牌全黑可重发</li>
            <li>• 手牌+桌面出现四张同点数可重发</li>
          </ul>
        </div>
      </div>
    </BaseModal>

    <!-- 设置弹窗 -->
    <BaseModal v-model="showSettings" title="设置">
      <SettingsPanel />
    </BaseModal>

    <!-- 加载中 -->
    <div v-if="!gameReady" class="w-full h-full flex items-center justify-center">
      <div class="text-center">
        <div class="w-10 h-10 border-3 border-[#00d4ff]/20 border-t-[#00d4ff] rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(0,212,255,0.3)]" />
        <p class="text-white/40 text-sm font-bold tracking-wider">正在准备牌桌...</p>
      </div>
    </div>

    <!-- 收牌选择提示 -->
    <Transition name="fade">
      <div
        v-if="gameReady && gameStore.awaitingCollectChoice && gameStore.isMyTurn"
        class="absolute bottom-44 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none"
      >
        <div class="neon-panel px-6 py-2.5 border border-[#39ff14]/30 animate-fade-in shadow-[0_0_25px_rgba(57,255,20,0.15)]">
          <div class="text-[#39ff14] text-base font-black text-glow-green">🎯 请选择要收哪张牌</div>
          <div class="text-white/40 text-xs mt-0.5 font-bold">点击桌面上绿色高亮的牌</div>
          <div v-if="hasDoubleRedFiveOption" class="text-[#ffd700] text-xs mt-1 font-black animate-pulse">
            💎 双红5！收得后+30分，对手各-10分
          </div>
        </div>
      </div>
    </Transition>

    <!-- 游戏桌面 -->
    <GameTable
      v-if="gameReady"
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
      :clickable-card-ids="clickableCardIds"
      :turn-timer-value="timer.timeLeft.value"
      :awaiting-collect-choice="gameStore.awaitingCollectChoice"
      :collecting-player-id="collectingPlayerId"
      @select-card="handleSelectCard"
      @play-card="handlePlayCard"
      @select-table-card="handleSelectTableCard"
      @discard-reset="handleDiscardReset"
      @decline-discard="handleDeclineDiscard"
    />

    <!-- 左上角功能按钮组 -->
    <div class="absolute top-2 left-2 z-20 flex gap-2">
      <button
        class="neon-panel px-3 py-1.5 text-white/40 hover:text-[#00d4ff] cursor-pointer text-xs flex items-center gap-1 transition-all hover:shadow-[0_0_10px_rgba(0,212,255,0.2)] font-bold"
        @click="showRules = true"
      >
        📖 规则
      </button>
      <button
        class="neon-panel px-3 py-1.5 text-white/40 hover:text-[#00d4ff] cursor-pointer text-xs flex items-center gap-1 transition-all hover:shadow-[0_0_10px_rgba(0,212,255,0.2)] font-bold"
        @click="showSettings = true"
      >
        ⚙️ 设置
      </button>
    </div>

    <!-- 翻牌提示浮层 -->
    <Transition name="fade">
      <div
        v-if="showFlipHint && flipHintCard"
        class="absolute top-32 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      >
        <div class="glass-panel px-6 py-3 border border-[#00d4ff]/30 shadow-[0_0_30px_rgba(0,212,255,0.15)] animate-pop-in flex flex-col items-center gap-2">
          <div class="text-[#00d4ff] text-sm font-black tracking-wider">翻出了</div>
          <div class="text-2xl font-black"
            :class="flipHintCard.isRed ? 'text-[#ff3366]' : 'text-white'"
          >
            {{ flipHintCard.display }}
          </div>
          <div class="text-white/40 text-xs">{{ flipHintCard.scoreValue > 0 ? `价值 ${flipHintCard.scoreValue} 分` : '无分值' }}</div>
        </div>
      </div>
    </Transition>

    <!-- 回合提示浮层 -->
    <Transition name="fade">
      <div
        v-if="showTurnHint"
        class="absolute top-24 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      >
        <div class="glass-panel px-8 py-3 text-[#ffd700] text-lg font-black animate-pop-in border border-[#ffd700]/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
          {{ turnHintText }}
        </div>
      </div>
    </Transition>

    <!-- 收牌喊牌提示 -->
    <Transition name="collect-hint">
      <div
        v-if="showCollectHint"
        class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-center pointer-events-none"
      >
        <div class="flex flex-col items-center gap-3">
          <!-- 玩家名 + 收牌！ -->
          <div class="text-3xl md:text-4xl font-black text-[#ffd700] text-glow-gold animate-bounce-slight">
            {{ collectHintPlayerName }} 收牌！
          </div>
          <!-- 收的牌 -->
          <div class="flex items-center gap-2 md:gap-3 glass-panel px-5 py-3 border border-white/10 shadow-[0_0_40px_rgba(255,215,0,0.2)]">
            <span
              class="text-xl md:text-2xl font-black"
              :class="collectHintCards[0]?.isRed ? 'text-[#ff3366]' : 'text-white'"
            >
              {{ collectHintCards[0]?.display }}
            </span>
            <span class="text-white/30 text-lg">+</span>
            <span
              class="text-xl md:text-2xl font-black"
              :class="collectHintCards[1]?.isRed ? 'text-[#ff3366]' : 'text-white'"
            >
              {{ collectHintCards[1]?.display }}
            </span>
          </div>
          <!-- 类型标签 -->
          <div class="text-white/50 text-sm font-bold tracking-wider">
            {{ collectHintType }}
          </div>
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
import { useGameTimer } from '@/composables/useGameTimer'
import { GamePhase, Card } from '@/engine'
import GameTable from '@/components/game/GameTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SettingsPanel from '@/components/common/SettingsPanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()
const timer = useGameTimer()

const showRules = ref(false)
const showSettings = ref(false)
const showDiscardModal = ref(false)
const showTurnHint = ref(false)
const turnHintText = ref('')
const gameReady = ref(false)

// 翻牌提示
const showFlipHint = ref(false)
const flipHintCard = ref<Card | null>(null)
let flipHintTimer: ReturnType<typeof setTimeout> | null = null

// 收牌喊牌提示
const showCollectHint = ref(false)
const collectHintPlayerName = ref('')
const collectHintCards = ref<Card[]>([])
const collectHintType = ref('')
let collectHintTimer: ReturnType<typeof setTimeout> | null = null

// 收牌玩家闪烁
const collectingPlayerId = ref<number>(-1)
let collectFlashTimer: ReturnType<typeof setTimeout> | null = null

// 新手引导
const showTutorial = ref(true)
const tutorialStep = ref(0)
const tutorialSteps = [
  {
    icon: '🎯',
    title: '游戏目标',
    desc: '和3个AI对手对战！\n\n通过出牌和收牌来获取分数。\n红色牌（红心/方块）有分值，\n黑色牌大部分是0分。\n最终分数最高的玩家获胜！',
  },
  {
    icon: '🃏',
    title: '怎么玩',
    desc: '1️⃣ 点击底部一张手牌选中它\n2️⃣ 点击「出牌」按钮打出\n\n如果桌面上有多张可收的牌，\n系统会让你选择收哪一张。\n选完后自动从牌堆翻一张新牌。',
  },
  {
    icon: '✨',
    title: '收牌规则（核心！）',
    desc: '【数字牌 A~9】\n  你出的牌 + 桌上某张牌 = 10 → 可收！\n  例：出了♦3，桌上有♥7 → 收走！\n\n【10/J/Q/K】\n  必须找到相同点数的牌才能收！\n  例：出了♠K，桌上有♥K → 收走！',
  },
  {
    icon: '💰',
    title: '计分小技巧',
    desc: '🔥 高分牌：黑桃A=30分！红心A/方块A=20分！\n📌 红色数字牌=牌面分数\n📌 红色10/J/Q/K=10分\n⚫ 黑色牌=0分（除了黑桃A）\n\n💡 策略：优先收红色高分牌！',
  },
]

// 高亮的牌ID（当前收牌配对）
const highlightedCardIds = computed(() => {
  const ids: string[] = []
  // 等待选择时高亮所有可选的桌面牌
  if (gameStore.awaitingCollectChoice && gameStore.isMyTurn) {
    for (const pair of gameStore.pendingCollectPairs) {
      ids.push(pair.tableCard.id)
    }
  }
  // 收牌动画高亮
  if (gameStore.currentCollectPairs.length > 0) {
    for (const pair of gameStore.currentCollectPairs) {
      ids.push(pair.playedCard.id, pair.tableCard.id)
    }
  }
  return ids
})

// 可点击的桌面牌ID（等待收牌选择时）
const clickableCardIds = computed(() => {
  if (!gameStore.awaitingCollectChoice || !gameStore.isMyTurn) return []
  return gameStore.pendingCollectPairs.map(p => p.tableCard.id)
})

// 是否存在双红5选项
const hasDoubleRedFiveOption = computed(() => {
  return gameStore.pendingCollectPairs.some(p =>
    p.playedCard.rank === 5 && p.tableCard.rank === 5 &&
    p.playedCard.isRed && p.tableCard.isRed
  )
})

// 监听翻牌，显示翻牌提示
watch(() => gameStore.currentFlippedCard, (card) => {
  if (card) {
    flipHintCard.value = card
    showFlipHint.value = true
    if (flipHintTimer) clearTimeout(flipHintTimer)
    flipHintTimer = setTimeout(() => {
      showFlipHint.value = false
    }, 2000)
  }
})

// 监听收牌，显示喊牌提示
watch(() => gameStore.currentCollectPairs, (pairs, oldPairs) => {
  // 仅在收牌配对首次出现时触发（从空变有）
  if (pairs.length > 0 && (!oldPairs || oldPairs.length === 0)) {
    const player = gameStore.currentPlayer
    if (player && pairs[0]) {
      collectHintPlayerName.value = player.name
      collectHintCards.value = [pairs[0].playedCard, pairs[0].tableCard]
      collectHintType.value = pairs[0].type === 'pair' ? '【对子】' : '【凑十】'
      showCollectHint.value = true
      // 触发座位闪烁
      collectingPlayerId.value = player.id
      if (collectFlashTimer) clearTimeout(collectFlashTimer)
      collectFlashTimer = setTimeout(() => {
        collectingPlayerId.value = -1
      }, 1500)
      if (collectHintTimer) clearTimeout(collectHintTimer)
      collectHintTimer = setTimeout(() => {
        showCollectHint.value = false
      }, 2000)
    }
  }
}, { deep: true })

// 监听弃牌重置
watch(() => gameStore.discardResetAvailable, (val) => {
  if (val) showDiscardModal.value = true
})

// 监听我的回合
watch(() => gameStore.isMyTurn, (myTurn) => {
  if (myTurn && gameStore.phase === GamePhase.Playing) {
    timer.start(30)
    showTurnHintTemp('轮到你出牌')
  } else {
    timer.stop()
  }
})

// 监听游戏结束
watch(() => gameStore.phase, (phase) => {
  if (phase === GamePhase.Settlement) {
    timer.stop()
    setTimeout(() => {
      router.push('/settlement')
    }, 1500)
  }
})

function showTurnHintTemp(text: string) {
  turnHintText.value = text
  showTurnHint.value = true
  setTimeout(() => {
    showTurnHint.value = false
  }, 1200)
}

function handleSelectCard(cardId: string) {
  if (gameStore.selectedCardId === cardId) {
    // 再次单击已选中的牌 = 直接出牌（自然交互）
    handlePlayCard(cardId)
  } else {
    gameStore.selectCard(cardId)
  }
}

function handlePlayCard(cardId: string) {
  if (!gameStore.isMyTurn || gameStore.isAnimating) return
  timer.stop()
  gameStore.playCard(cardId)
}

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  if (!gameStore.isMyTurn || gameStore.isAnimating || gameStore.phase !== GamePhase.Playing) return
  const hand = gameStore.players[0]?.hand
  if (!hand || hand.length === 0) return

  const currentIdx = hand.findIndex(c => c.id === gameStore.selectedCardId)

  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    if (gameStore.selectedCardId) {
      handlePlayCard(gameStore.selectedCardId)
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const idx = currentIdx > 0 ? currentIdx - 1 : hand.length - 1
    gameStore.selectCard(hand[idx].id)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    const idx = currentIdx < hand.length - 1 && currentIdx !== -1 ? currentIdx + 1 : 0
    gameStore.selectCard(hand[idx].id)
  }
}

function handleSelectTableCard(cardId: string) {
  if (!gameStore.awaitingCollectChoice) return
  // 找到对应的配对索引
  const pairIndex = gameStore.pendingCollectPairs.findIndex(p => p.tableCard.id === cardId)
  if (pairIndex !== -1) {
    gameStore.selectCollectPair(pairIndex)
  }
}

function handleDiscardReset() {
  showDiscardModal.value = false
  gameStore.executeDiscardReset()
}

function handleDeclineDiscard() {
  showDiscardModal.value = false
  gameStore.declineDiscardReset()
}

onMounted(() => {
  const names = lobbyStore.getGamePlayerNames()
  const avatars = lobbyStore.getGamePlayerAvatars()
  gameStore.initGame(names, avatars)
  gameReady.value = true
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.collect-hint-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.collect-hint-leave-active {
  transition: all 0.4s ease;
}
.collect-hint-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.collect-hint-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.1);
}

@keyframes bounce-slight {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-slight {
  animation: bounce-slight 0.6s ease infinite;
}
</style>
