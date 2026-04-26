<template>
  <div class="room-view w-screen h-screen flex flex-col items-center justify-center table-bg">
    <div class="glass-panel p-8 w-full max-w-lg mx-4 animate-pop-in">
      <!-- 房间标题 -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gold-light mb-2">{{ currentRoom?.name || '房间' }}</h2>
        <p class="text-white/40 text-sm">房间号: {{ $route.params.id }}</p>
      </div>

      <!-- 四方位座位 -->
      <div class="grid grid-cols-2 gap-3 mb-8">
        <div
          v-for="seat in seats"
          :key="seat.index"
          class="glass-panel p-4 flex items-center gap-3 transition-all"
          :class="seat.player ? 'border border-[#ffd700]/20 shadow-[0_0_10px_rgba(255,215,0,0.05)]' : 'opacity-60'"
        >
          <template v-if="seat.player">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#ffd700] to-[#c9a000] flex items-center justify-center text-[#1a0a00] font-black text-sm shrink-0">
              {{ seat.player.name.charAt(0) }}
            </div>
            <div class="min-w-0">
              <div class="text-white text-sm font-bold truncate">{{ seat.player.name }}</div>
              <div class="text-white/30 text-[10px] font-bold">{{ seat.player.isAI ? 'AI 对手' : '玩家' }}</div>
            </div>
            <div v-if="seat.player.isReady" class="ml-auto text-[#39ff14] text-xs font-black">✓ 就绪</div>
          </template>
          <template v-else>
            <div class="w-9 h-9 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center shrink-0">
              <span class="text-white/15 text-xs font-bold">?</span>
            </div>
            <div class="text-white/20 text-sm font-medium">等待加入...</div>
          </template>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <BaseButton variant="gold" size="lg" @click="handleStartGame">
          {{ playerCount >= 4 ? '开始游戏' : `开始游戏 (自动补AI-${4 - playerCount}人)` }}
        </BaseButton>
        <BaseButton variant="dark" size="md" @click="handleBack">
          返回大厅
        </BaseButton>
      </div>

      <!-- 倒计时提示 -->
      <div v-if="isCountingDown" class="text-center mt-4">
        <div class="text-gold-light text-lg font-bold animate-pulse">
          游戏即将开始 {{ countDown }}s
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLobbyStore } from '@/stores/lobbyStore'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAvatar from '@/components/common/BaseAvatar.vue'

const router = useRouter()
const route = useRoute()
const lobbyStore = useLobbyStore()

const isCountingDown = ref(false)
const countDown = ref(3)

const currentRoom = computed(() => lobbyStore.currentRoom)
const playerCount = computed(() => currentRoom.value?.players.length || 0)

const seats = computed(() => {
  const result = []
  for (let i = 0; i < 4; i++) {
    const player = currentRoom.value?.players[i]
    result.push({ index: i, player: player || null })
  }
  return result
})

function handleStartGame() {
  if (playerCount.value < 4) {
    // 自动补充AI
    if (currentRoom.value) {
      const aiNames = ['小明', '小红', '大壮']
      const avatarList = lobbyStore.avatarList
      const startIdx = currentRoom.value.players.length
      for (let i = startIdx; i < 4; i++) {
        currentRoom.value.players.push({
          id: i,
          name: aiNames[i - 1] || `AI${i}`,
          avatar: avatarList[i] || '',
          hand: [],
          collected: [],
          score: 0,
          isAI: true,
          isReady: true,
          seatIndex: i,
        })
      }
    }
  }

  // 倒计时开始
  isCountingDown.value = true
  countDown.value = 3
  const timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer)
      router.push('/game')
    }
  }, 1000)
}

function handleBack() {
  lobbyStore.currentRoom = null
  router.push('/lobby')
}

onMounted(() => {
  if (!currentRoom.value) {
    router.push('/lobby')
  }
})
</script>
