<template>
  <div class="settlement-view w-screen h-screen flex items-center justify-center overflow-y-auto table-bg">
    <div class="glass-panel p-6 md:p-8 w-full max-w-2xl mx-4 my-8 animate-pop-in">
      <!-- 胜利标题 -->
      <div class="text-center mb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-gold-light mb-2">
          {{ victoryTitle }}
        </h1>
        <p class="text-white/60 text-sm">
          {{ victoryDesc }}
        </p>
      </div>

      <!-- 排名展示 -->
      <div v-if="settlement" class="space-y-3 mb-6">
        <div
          v-for="(pData, idx) in sortedPlayers"
          :key="pData.id"
          class="glass-panel p-4 flex items-center gap-3 md:gap-4 transition-all animate-slide-in"
          :class="[
            pData.rank === 1 ? 'border border-gold/50 ring-1 ring-gold/30' : '',
          ]"
          :style="{ animationDelay: idx * 150 + 'ms' }"
        >
          <!-- 排名徽章 -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
            :class="{
              'bg-gold-light text-black': pData.rank === 1,
              'bg-gray-400 text-black': pData.rank === 2,
              'bg-amber-700 text-white': pData.rank === 3,
              'bg-gray-600 text-white': pData.rank === 4,
            }"
          >
            {{ pData.rank }}
          </div>

          <!-- 玩家信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <BaseAvatar :src="pData.avatar" :name="pData.name" size="sm" />
              <span class="text-white font-medium text-sm truncate">{{ pData.name }}</span>
              <span v-if="pData.id === 0" class="text-[10px] text-gold-light bg-gold/20 px-1.5 py-0.5 rounded">你</span>
            </div>
          </div>

          <!-- 分数 -->
          <div class="text-right flex-shrink-0">
            <div class="text-xl md:text-2xl font-black tabular-nums" :class="pData.diff >= 0 ? 'text-[#39ff14]' : 'text-[#ff3366]'">
              {{ pData.score }}
            </div>
            <div class="text-xs font-bold" :class="pData.diff >= 0 ? 'text-[#39ff14]/60' : 'text-[#ff3366]/60'">
              {{ pData.diff >= 0 ? '+' : '' }}{{ pData.diff }}
            </div>
          </div>

          <!-- 冠军皇冠 -->
          <div v-if="pData.rank === 1" class="text-2xl md:text-3xl flex-shrink-0">👑</div>
        </div>
      </div>

      <!-- 胜利条件说明 -->
      <div v-if="settlement" class="glass-panel p-3 mb-6 text-center">
        <span class="text-xs text-white/40">胜利条件：</span>
        <span class="text-xs text-gold-light">
          {{ conditionText }}
        </span>
      </div>

      <!-- 分数明细展开 -->
      <div v-if="settlement && showDetail" class="mb-6">
        <h3 class="text-sm font-bold text-gold-light mb-3">分数明细</h3>
        <div class="space-y-2">
          <div v-for="pData in sortedPlayers" :key="'detail-' + pData.id" class="text-xs">
            <div class="text-white/60 mb-1">{{ pData.name }} 的收牌：</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="c in pData.collected"
                :key="c.id"
                class="px-1 py-0.5 rounded text-[10px]"
                :class="c.isRed ? 'bg-red-900/40 text-red-300' : 'bg-gray-700/40 text-gray-300'"
              >
                {{ c.display }}<span v-if="c.scoreValue > 0" class="text-amber-400">({{ c.scoreValue }})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mb-4">
        <button
          class="text-xs text-white/40 hover:text-white/70 cursor-pointer underline"
          @click="showDetail = !showDetail"
        >
          {{ showDetail ? '收起明细' : '查看分数明细' }}
        </button>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <BaseButton variant="gold" size="lg" @click="handlePlayAgain">
          再来一局
        </BaseButton>
        <BaseButton variant="dark" size="md" @click="handleBackToLobby">
          返回大厅
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { generateSettlement, SettlementData, VictoryCondition } from '@/engine'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAvatar from '@/components/common/BaseAvatar.vue'

const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()

const showDetail = ref(false)

const settlement = computed<SettlementData | null>(() => {
  return gameStore.gameState.getSettlement()
})

const sortedPlayers = computed(() => {
  if (!settlement.value) return []
  return [...settlement.value.players].sort((a, b) => a.rank - b.rank)
})

const victoryTitle = computed(() => {
  if (!settlement.value) return '🎉 对局结束'
  const winner = settlement.value.players.find(p => p.id === settlement.value!.winnerId)
  if (winner?.id === 0) return '🏆 恭喜你赢了！'
  return `${winner?.name || '对手'} 获胜`
})

const victoryDesc = computed(() => {
  if (!settlement.value) return ''
  const c = settlement.value.victoryCondition
  if (c === VictoryCondition.Score240) return '达到240分直接胜利！'
  if (c === VictoryCondition.Score0) return '最终0分直接胜利！'
  return '常规结算 - 分高者胜'
})

const conditionText = computed(() => {
  if (!settlement.value) return ''
  const c = settlement.value.victoryCondition
  if (c === VictoryCondition.Score240) return '达到240分直接胜利'
  if (c === VictoryCondition.Score0) return '一分未得·按240分结算获胜'
  return '常规结算·分高者胜'
})

function handlePlayAgain() {
  const names = lobbyStore.getGamePlayerNames()
  const avatars = lobbyStore.getGamePlayerAvatars()
  gameStore.initGame(names, avatars)
  router.push('/game')
}

function handleBackToLobby() {
  router.push('/lobby')
}
</script>
