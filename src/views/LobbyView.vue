<template>
  <div class="lobby-view w-screen h-screen flex flex-col table-bg">
    <!-- 顶部导航 -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-white/10 z-10">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffd700] to-[#c9a000] flex items-center justify-center text-[#1a0a00] font-black text-lg shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          🃏
        </div>
        <h1 class="text-xl font-black text-gold-light text-glow-gold tracking-wide">台湾捡红点</h1>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 glass-panel px-3 py-1.5">
          <BaseAvatar :src="lobbyStore.playerAvatar" :name="lobbyStore.playerName" size="sm" />
          <span class="text-white/80 text-sm font-medium">{{ lobbyStore.playerName }}</span>
        </div>
        <button class="text-white/40 hover:text-[#00d4ff] cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-white/5" @click="showSettings = true">
          <Settings :size="20" />
        </button>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      <!-- 功能入口 -->
      <div class="flex flex-col items-center gap-5 mb-10 w-full max-w-md">
        <div class="text-center mb-2">
          <h2 class="text-2xl font-black text-white tracking-wide">欢迎来到牌桌</h2>
          <p class="text-white/40 text-sm mt-1">选择对局方式，开始游戏</p>
        </div>

        <!-- 快速匹配大按钮 -->
        <div class="flex flex-col items-center gap-3 w-full">
          <button
            class="btn-gold text-lg px-12 py-5 rounded-2xl cursor-pointer w-full max-w-xs relative overflow-hidden group"
            :disabled="lobbyStore.isMatching"
            @click="handleQuickMatch"
          >
            <template v-if="lobbyStore.isMatching">
              <div class="flex items-center justify-center gap-3">
                <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                匹配中...
              </div>
            </template>
            <template v-else>
              <span class="relative z-10 flex items-center justify-center gap-2">
                ⚡ 快速匹配
              </span>
            </template>
          </button>

          <!-- 取消匹配按钮 -->
          <button
            v-if="lobbyStore.isMatching"
            class="text-white/40 hover:text-white/70 text-sm underline cursor-pointer transition-colors"
            @click="handleCancelMatch"
          >
            取消匹配
          </button>
        </div>

        <div class="flex items-center gap-3 w-full justify-center">
          <!-- 创建房间 -->
          <BaseButton variant="dark" size="md" @click="showCreateRoom = true">
            🏠 创建房间
          </BaseButton>
          <!-- 规则说明 -->
          <BaseButton variant="dark" size="md" @click="showRules = true">
            📖 游戏规则
          </BaseButton>
        </div>
      </div>

      <!-- 房间列表 -->
      <div class="w-full max-w-2xl">
        <h3 class="text-white/40 text-sm mb-3 font-bold tracking-wider">房间列表</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="room in lobbyStore.rooms"
            :key="room.id"
            class="glass-panel p-4 hover:border-[#ffd700]/30 hover:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all cursor-pointer group"
            @click="handleJoinRoom(room.id)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-white font-bold text-sm group-hover:text-[#ffd700] transition-colors">{{ room.name }}</span>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                :class="room.status === 'waiting' ? 'bg-[#39ff14]/15 text-[#39ff14]' : 'bg-[#ff3366]/15 text-[#ff3366]'"
              >
                {{ room.status === 'waiting' ? '等待中' : '游戏中' }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-white/30 text-xs">
              <span class="text-[#00d4ff]/50 font-bold">{{ room.players.length }}/{{ room.maxPlayers }}</span>
              <span>人</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="text-center py-3 text-white/15 text-xs border-t border-white/5">
      台湾捡红点 v1.0 · 休闲棋牌
    </footer>

    <!-- 创建房间弹窗 -->
    <BaseModal v-model="showCreateRoom" title="创建房间">
      <div class="py-4">
        <label class="text-white/60 text-sm mb-2 block">房间名称</label>
        <input
          v-model="newRoomName"
          type="text"
          placeholder="请输入房间名称"
          maxlength="10"
          class="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors mb-6"
        />
        <div class="flex justify-end gap-3">
          <BaseButton variant="dark" @click="showCreateRoom = false">取消</BaseButton>
          <BaseButton variant="gold" :disabled="!newRoomName.trim()" @click="handleCreateRoom">创建</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 规则弹窗 -->
    <BaseModal v-model="showRules" title="游戏规则">
      <div class="space-y-3 text-sm text-white/80 max-h-[60vh] overflow-y-auto py-2">
        <div>
          <h3 class="text-gold-light font-bold mb-1">基本规则</h3>
          <p>52张牌，4人对局，顺时针出牌</p>
          <p>A=1点，2-9=原点数，10/J/Q/K=10点</p>
        </div>
        <div>
          <h3 class="text-gold-light font-bold mb-1">收牌规则</h3>
          <p>A-9：两张相加=10可回收</p>
          <p>10/J/Q/K：必须同点对子回收</p>
        </div>
        <div>
          <h3 class="text-gold-light font-bold mb-1">回合流程</h3>
          <p>出1张手牌 → 判定收牌 → 翻1张新牌 → 再判定 → 回合结束</p>
        </div>
        <div>
          <h3 class="text-gold-light font-bold mb-1">计分</h3>
          <p>黑桃A=30 红桃A/方块A=20 梅花A=0</p>
          <p>红2-8=牌面分 红9/10/J/Q/K=10分</p>
          <p>其余黑色牌0分 总分240</p>
        </div>
      </div>
    </BaseModal>

    <!-- 设置弹窗 -->
    <BaseModal v-model="showSettings" title="设置">
      <div class="space-y-4 py-2">
        <div class="flex items-center justify-between">
          <span class="text-white/80 text-sm">音效</span>
          <button class="cursor-pointer" @click="settingsStore.toggleSound()">
            {{ settingsStore.isSoundEnabled ? '🔊 开' : '🔇 关' }}
          </button>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white/80 text-sm">动画速度</span>
          <input type="range" min="0.5" max="2" step="0.1" v-model.number="animSpeed" class="w-32" />
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Settings } from 'lucide-vue-next'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseAvatar from '@/components/common/BaseAvatar.vue'

const router = useRouter()
const lobbyStore = useLobbyStore()
const settingsStore = useSettingsStore()

const showCreateRoom = ref(false)
const showRules = ref(false)
const showSettings = ref(false)
const newRoomName = ref('')
const animSpeed = ref(settingsStore.animationSpeed)

watch(animSpeed, (v) => settingsStore.setAnimationSpeed(v))

async function handleQuickMatch() {
  try {
    const room = await lobbyStore.quickMatch()
    if (room.players.length >= 4 || room.status === 'playing') {
      // 4人齐了直接开游戏
      router.push('/game')
    } else {
      router.push(`/room/${room.id}`)
    }
  } catch (error) {
    console.error('匹配失败:', error)
    alert('匹配失败，请重试')
  }
}

function handleCancelMatch() {
  lobbyStore.cancelMatch()
}

function handleCreateRoom() {
  if (!newRoomName.value.trim()) return
  const room = lobbyStore.createRoom(newRoomName.value.trim())
  showCreateRoom.value = false
  router.push(`/room/${room.id}`)
}

function handleJoinRoom(roomId: string) {
  const room = lobbyStore.rooms.find(r => r.id === roomId)
  if (!room || room.status === 'playing') return
  lobbyStore.currentRoom = room
  router.push(`/room/${roomId}`)
}
</script>
