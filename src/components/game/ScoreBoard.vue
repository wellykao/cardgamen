<template>
  <div class="score-board glass-panel p-3">
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs font-black text-[#ffd700] tracking-wider text-glow-gold">实时计分</div>
      <div class="text-[10px] text-white/25 font-bold">{{ totalScore }}/240</div>
    </div>
    <div class="space-y-2">
      <div
        v-for="player in players"
        :key="player.id"
        class="flex flex-col gap-1"
      >
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5">
            <div
              class="w-2 h-2 rounded-full"
              :class="player.id === currentId
                ? 'bg-[#ffd700] shadow-[0_0_6px_rgba(255,215,0,0.8)] animate-pulse'
                : 'bg-white/20'"
            />
            <span :class="player.id === currentId ? 'text-[#ffd700] font-bold' : 'text-white/50'">
              {{ player.name }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[#ffd700] font-black tabular-nums">{{ player.score }}</span>
            <span
              class="text-[10px] font-bold tabular-nums"
              :class="getDiffClass(getScoreDiff(player))"
            >
              {{ getScoreDiff(player) >= 0 ? '+' : '' }}{{ getScoreDiff(player) }}
            </span>
          </div>
        </div>
        <!-- 分数进度条 -->
        <div class="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="player.id === currentId ? 'bg-gradient-to-r from-[#ffd700] to-[#ffea70]' : 'bg-white/20'"
            :style="{ width: Math.min((player.score / 240) * 100, 100) + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Player, getScoreDiff } from '@/engine'

const props = defineProps<{
  players: Player[]
  currentId: number
}>()

const totalScore = computed(() => props.players.reduce((s, p) => s + p.score, 0))

function getDiffClass(diff: number): string {
  if (diff > 0) return 'text-[#39ff14]'
  if (diff < 0) return 'text-[#ff3366]'
  return 'text-white/40'
}
</script>
