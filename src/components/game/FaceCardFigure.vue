<template>
  <div class="w-full h-full flex flex-col items-center justify-center relative">
    <!-- 皇冠 -->
    <div class="relative mb-[2px]">
      <div class="flex items-end justify-center gap-[1px]">
        <div class="w-[3px] h-[4px] rounded-t-sm" :style="fillStyle" />
        <div class="w-[4px] h-[6px] rounded-t-sm" :style="fillStyle" />
        <div class="w-[3px] h-[4px] rounded-t-sm" :style="fillStyle" />
      </div>
      <div class="w-[14px] h-[2px] rounded-full mt-[1px]" :style="fillStyle" />
    </div>

    <!-- 头部 -->
    <div class="relative">
      <div
        class="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-[1.5px]"
        :style="{
          background: isRed ? '#c41e3a' : '#222',
          borderColor: isRed ? '#c41e3a' : '#222'
        }"
      >
        <!-- 面部 -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- 眼睛 -->
          <div class="absolute top-[28%] left-[25%] w-[6%] h-[6%] rounded-full bg-white/80" />
          <div class="absolute top-[28%] right-[25%] w-[6%] h-[6%] rounded-full bg-white/80" />
          <!-- 鼻子 -->
          <div class="absolute top-[40%] left-1/2 -translate-x-1/2 w-[4%] h-[12%] bg-white/40 rounded-full" />
          <!-- 嘴巴 -->
          <div class="absolute top-[58%] left-1/2 -translate-x-1/2 w-[20%] h-[3%] bg-white/50 rounded-full" />
          <!-- 胡子（仅K） -->
          <div v-if="rank === Rank.King" class="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[30%] h-[12%] bg-white/30 rounded-b-full" />
        </div>
      </div>
    </div>

    <!-- 衣领 -->
    <div class="w-5 h-[2px] mt-[2px] rounded-full" :style="{ background: isRed ? 'rgba(196,30,58,0.4)' : 'rgba(34,34,34,0.4)' }" />

    <!-- 身体 + 手持物 -->
    <div class="relative flex items-start justify-center mt-[2px]">
      <!-- 身体 -->
      <div
        class="w-8 h-5 md:w-9 md:h-6 flex items-center justify-center overflow-hidden"
        :style="{
          background: isRed ? '#c41e3a' : '#222',
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          opacity: 0.9
        }"
      >
        <!-- 衣服装饰 -->
        <div class="w-[2px] h-full bg-white/20" />
      </div>

      <!-- 手持物 -->
      <div class="absolute -right-[6px] top-0 h-full flex items-start pt-[1px]">
        <!-- J: 权杖 -->
        <div v-if="rank === Rank.Jack" class="relative">
          <div class="w-[2px] h-5 md:h-6 rounded-full" :style="fillStyle" />
          <div class="absolute -top-[2px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full border" :style="{ borderColor: isRed ? '#c41e3a' : '#222', background: 'white' }" />
        </div>
        <!-- Q: 花 -->
        <div v-if="rank === Rank.Queen" class="relative">
          <div class="w-[2px] h-4 md:h-5 rounded-full" :style="{ background: isRed ? '#c41e3a' : '#222' }" />
          <div class="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full" :style="{ background: isRed ? '#c41e3a' : '#222' }" />
        </div>
        <!-- K: 剑 -->
        <div v-if="rank === Rank.King" class="relative">
          <div class="w-[2.5px] h-5 md:h-6 rounded-full" :style="{ background: isRed ? '#c41e3a' : '#222' }" />
          <div class="absolute top-[6px] left-1/2 -translate-x-1/2 w-[8px] h-[2px] rounded-full" :style="{ background: isRed ? '#c41e3a' : '#222' }" />
        </div>
      </div>
    </div>

    <!-- 底部名字 -->
    <div class="mt-[2px] text-[6px] md:text-[7px] font-bold tracking-widest uppercase opacity-40"
      :class="isRed ? 'text-[#c41e3a]' : 'text-[#222]'"
    >
      {{ figureName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Rank } from '@/engine'

const props = defineProps<{
  rank: Rank
  isRed: boolean
}>()

const fillStyle = computed(() => ({
  background: props.isRed ? '#c41e3a' : '#222'
}))

const figureName = computed(() => {
  if (props.rank === Rank.Jack) return 'Jack'
  if (props.rank === Rank.Queen) return 'Queen'
  if (props.rank === Rank.King) return 'King'
  return ''
})
</script>
