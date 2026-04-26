<template>
  <div class="turn-timer relative w-11 h-11 flex items-center justify-center">
    <!-- 环形进度 -->
    <svg class="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
      <circle
        cx="20" cy="20" r="16"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        stroke-width="3"
      />
      <circle
        cx="20" cy="20" r="16"
        fill="none"
        :stroke="strokeColor"
        stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-all duration-1000 ease-linear"
        :style="{ filter: `drop-shadow(0 0 6px ${strokeColor})` }"
      />
    </svg>
    <!-- 数字 -->
    <span class="text-sm font-black tabular-nums"
      :class="timeLeft <= 5 ? 'text-[#ff3366] text-glow-red' : 'text-white/90'"
    >
      {{ timeLeft }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timeLeft: number
  maxTime: number
}>()

const circumference = 2 * Math.PI * 16

const dashOffset = computed(() => {
  const progress = props.timeLeft / props.maxTime
  return circumference * (1 - progress)
})

const strokeColor = computed(() => {
  if (props.timeLeft <= 5) return '#ff3366'
  if (props.timeLeft <= 10) return '#ffaa00'
  return '#39ff14'
})
</script>
