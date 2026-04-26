<template>
  <div
    class="player-seat flex items-center gap-2.5 px-3 py-2 transition-all duration-300"
    :class="[
      isCollecting
        ? 'neon-panel border-[#39ff14]/50 shadow-[0_0_25px_rgba(57,255,20,0.4)] scale-110 animate-collect-flash'
        : isActive
          ? 'neon-panel border-[#ffd700]/30 shadow-[0_0_15px_rgba(255,215,0,0.15)] scale-105'
          : 'glass-panel opacity-80',
    ]"
  >
    <!-- 头像 -->
    <div
      class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all duration-300"
      :class="isActive
        ? 'bg-gradient-to-br from-[#ffd700] to-[#c9a000] text-[#1a0a00] shadow-[0_0_12px_rgba(255,215,0,0.5)] scale-110'
        : 'bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] text-[#8888a0]'
      "
    >
      {{ player.name.charAt(0) }}
    </div>

    <!-- 信息 -->
    <div class="flex flex-col min-w-0">
      <div class="text-xs font-black truncate tracking-wide"
        :class="isActive ? 'text-[#ffd700] text-glow-gold' : 'text-white/60'"
      >
        {{ player.name }}
        <span v-if="player.isAI" class="text-white/25 text-[9px] font-bold">AI</span>
      </div>
      <div class="flex items-center gap-2.5 text-[10px]">
        <span class="text-[#ffd700] font-black tabular-nums">{{ player.score }}分</span>
        <span class="text-white/25">{{ player.hand.length }}张</span>
        <span class="text-[#00d4ff]/50">{{ player.collected.length }}收</span>
      </div>
    </div>

    <!-- 回合指示 -->
    <div v-if="isActive" class="ml-auto">
      <div class="w-2 h-2 rounded-full bg-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.9)] animate-pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Player } from '@/engine'

defineProps<{
  player: Player
  isActive: boolean
  isCollecting?: boolean
}>()
</script>

<style scoped>
@keyframes collect-flash {
  0%, 100% {
    box-shadow: 0 0 25px rgba(57, 255, 20, 0.4);
    border-color: rgba(57, 255, 20, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(57, 255, 20, 0.7);
    border-color: rgba(57, 255, 20, 0.9);
  }
}
.animate-collect-flash {
  animation: collect-flash 0.4s ease-in-out 3;
}
</style>
