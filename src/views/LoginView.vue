<template>
  <div class="login-view w-screen h-screen flex items-center justify-center"
    style="background: linear-gradient(135deg, #0D1B0E 0%, #1B5E20 50%, #0D1B0E 100%);"
  >
    <div class="glass-panel p-8 w-full max-w-md mx-4 animate-fade-in">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gold-light mb-2">🃏 台湾捡红点</h1>
        <p class="text-white/50 text-sm">经典4人棋牌，欢乐对局</p>
      </div>

      <!-- 头像选择 -->
      <div class="mb-6">
        <label class="text-white/60 text-sm mb-2 block">选择头像</label>
        <div class="flex justify-center gap-3">
          <div
            v-for="(avatar, index) in avatarList"
            :key="index"
            class="w-14 h-14 rounded-full cursor-pointer border-2 transition-all duration-200 overflow-hidden"
            :class="selectedAvatarIndex === index ? 'border-gold-light scale-110' : 'border-white/20 hover:border-white/50'"
            @click="selectedAvatarIndex = index"
          >
            <img :src="avatar" alt="头像" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- 昵称输入 -->
      <div class="mb-8">
        <label class="text-white/60 text-sm mb-2 block">输入昵称</label>
        <input
          v-model="playerName"
          type="text"
          placeholder="请输入你的昵称"
          maxlength="8"
          class="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors"
          @keyup.enter="handleLogin"
        />
      </div>

      <!-- 登录按钮 -->
      <BaseButton variant="gold" size="lg" class="w-full" :disabled="!playerName.trim()" @click="handleLogin">
        进入大厅
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLobbyStore } from '@/stores/lobbyStore'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const lobbyStore = useLobbyStore()

const playerName = ref('')
const selectedAvatarIndex = ref(0)
const avatarList = lobbyStore.avatarList

function handleLogin() {
  if (!playerName.value.trim()) return
  lobbyStore.login(playerName.value.trim(), avatarList[selectedAvatarIndex.value])
  router.push('/lobby')
}
</script>
