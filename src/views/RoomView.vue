<template>
  <div class="room-view w-screen h-screen flex flex-col table-bg">
    <!-- 顶部导航 -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-white/10 z-10">
      <div class="flex items-center gap-3">
        <button
          class="text-white/30 hover:text-[#ff3366] cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="返回大厅"
          @click="handleLeave"
        >
          <span class="text-sm font-bold">←</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffd700] to-[#c9a000] flex items-center justify-center text-[#1a0a00] font-black text-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          🃏
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-black text-gold-light text-glow-gold tracking-wide leading-tight">
            {{ mpStore.currentRoom?.name || '房间' }}
          </h1>
          <span class="text-white/30 text-xs">房间号: {{ mpStore.currentRoom?.room_code }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="text-xs px-3 py-1 rounded-full font-bold"
          :class="statusClass"
        >
          {{ statusText }}
        </span>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <!-- 玩家座位 -->
      <div class="w-full max-w-lg mb-8">
        <h3 class="text-white/40 text-sm mb-4 font-bold tracking-wider text-center">
          玩家 {{ mpStore.sortedPlayers.length }}/4
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="seat in 4"
            :key="seat - 1"
            class="glass-panel p-4 rounded-xl transition-all"
            :class="{
              'border-[#ffd700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]': getPlayerAtSeat(seat - 1)?.user_id === mpStore.myPlayerId,
              'opacity-50': !getPlayerAtSeat(seat - 1),
            }"
          >
            <template v-if="getPlayerAtSeat(seat - 1)">
              <div class="flex items-center gap-3">
                <BaseAvatar
                  :src="getPlayerAtSeat(seat - 1)!.avatar"
                  :name="getPlayerAtSeat(seat - 1)!.name"
                  size="md"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-bold text-sm truncate">
                      {{ getPlayerAtSeat(seat - 1)!.name }}
                    </span>
                    <span v-if="getPlayerAtSeat(seat - 1)!.user_id === mpStore.currentRoom?.host_id" class="text-[10px] bg-[#ffd700]/20 text-[#ffd700] px-1.5 py-0.5 rounded font-bold">
                      房主
                    </span>
                  </div>
                  <span
                    class="text-xs font-bold"
                    :class="getPlayerAtSeat(seat - 1)!.is_ready ? 'text-[#39ff14]' : 'text-white/30'"
                  >
                    {{ getPlayerAtSeat(seat - 1)!.is_ready ? '✓ 已准备' : '等待中...' }}
                  </span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 text-lg">
                  ?
                </div>
                <span class="text-white/20 text-sm">等待玩家...</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col items-center gap-3 w-full max-w-xs">
        <!-- 准备按钮 -->
        <button
          v-if="mpStore.currentRoom?.status === 'waiting'"
          class="btn-gold text-base px-10 py-4 rounded-2xl cursor-pointer w-full relative overflow-hidden"
          :disabled="isTogglingReady"
          @click="handleToggleReady"
        >
          <span v-if="isTogglingReady" class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            处理中...
          </span>
          <span v-else-if="myPlayer?.is_ready">取消准备</span>
          <span v-else>准备</span>
        </button>

        <!-- 开始游戏按钮（仅房主） -->
        <button
          v-if="mpStore.isHost && mpStore.currentRoom?.status === 'waiting'"
          class="btn-gold text-base px-10 py-4 rounded-2xl cursor-pointer w-full relative overflow-hidden"
          :disabled="!mpStore.canStart || isStarting"
          :class="{ 'opacity-50 cursor-not-allowed': !mpStore.canStart }"
          @click="handleStartGame"
        >
          <span v-if="isStarting" class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            开始中...
          </span>
          <span v-else>开始游戏</span>
        </button>

        <!-- 游戏已开始提示 -->
        <div v-if="mpStore.currentRoom?.status === 'playing'" class="text-center">
          <div class="text-[#39ff14] text-lg font-black animate-pulse mb-2">游戏进行中</div>
          <p class="text-white/40 text-sm">正在加载牌桌...</p>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="text-center py-3 text-white/15 text-xs border-t border-white/5">
      台湾捡红点 v1.0 · 休闲棋牌
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import BaseAvatar from '@/components/common/BaseAvatar.vue'

const router = useRouter()
const mpStore = useMultiplayerStore()

const isTogglingReady = ref(false)
const isStarting = ref(false)

const myPlayer = computed(() => {
  return mpStore.roomPlayers.find(p => p.user_id === mpStore.myPlayerId)
})

const statusText = computed(() => {
  if (!mpStore.currentRoom) return ''
  const map: Record<string, string> = { waiting: '等待中', playing: '游戏中', finished: '已结束' }
  return map[mpStore.currentRoom.status] || mpStore.currentRoom.status
})

const statusClass = computed(() => {
  if (!mpStore.currentRoom) return ''
  const map: Record<string, string> = {
    waiting: 'bg-[#39ff14]/15 text-[#39ff14]',
    playing: 'bg-[#ffd700]/15 text-[#ffd700]',
    finished: 'bg-white/10 text-white/40',
  }
  return map[mpStore.currentRoom.status] || ''
})

function getPlayerAtSeat(seatIndex: number) {
  return mpStore.sortedPlayers.find(p => p.seat_index === seatIndex)
}

async function handleToggleReady() {
  isTogglingReady.value = true
  try { await mpStore.toggleReady() } finally { isTogglingReady.value = false }
}

async function handleStartGame() {
  if (!mpStore.canStart) return
  isStarting.value = true
  try { await mpStore.startGame() } catch (e: any) {
    alert('开始游戏失败: ' + (e.message || '未知错误'))
  } finally { isStarting.value = false }
}

async function handleLeave() {
  await mpStore.leaveRoom()
  router.push('/lobby')
}

// 监听房间状态变化，游戏开始则跳转
let unwatch: (() => void) | null = null

onMounted(() => {
  const roomId = router.currentRoute.value.params.id as string
  if (roomId) {
    console.log('[RoomView] mounted, roomId:', roomId, 'currentRoom:', mpStore.currentRoom?.id)
    if (!mpStore.currentRoom) {
      mpStore.loadRoomState(roomId).then(() => {
        if (mpStore.currentRoom) {
          mpStore.subscribeToRoom(roomId)
        } else {
          router.push('/lobby')
        }
      })
    } else {
      mpStore.subscribeToRoom(roomId)
    }
  }

  unwatch = mpStore.$subscribe((_, state) => {
    if (state.currentRoom?.status === 'playing') {
      router.push('/game')
    }
  })
})

onUnmounted(() => {
  if (unwatch) unwatch()
  if (mpStore.currentRoom?.status !== 'playing') {
    mpStore.leaveRoom()
  }
})
</script>
