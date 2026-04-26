<template>
  <div
    class="card-item relative cursor-pointer select-none flex-shrink-0"
    :class="[
      isFaceDown ? '' : 'card-interactive',
      isSelected ? 'card-selected' : '',
      size === 'sm' ? 'w-[56px] h-[80px]' : size === 'lg' ? 'w-[96px] h-[132px]' : 'w-[84px] h-[116px]',
    ]"
    :style="{ marginLeft: marginLeft }"
    @click="$emit('click')"
    @dblclick="$emit('dblclick')"
  >
    <!-- 牌背 - 高清红色网格 -->
    <div v-if="isFaceDown"
      class="w-full h-full rounded-xl flex items-center justify-center overflow-hidden shadow-md"
      :class="cardBackGlowClass"
    >
      <div class="absolute inset-0 rounded-xl bg-white" />
      <div class="absolute inset-[3px] rounded-[10px] overflow-hidden"
        style="background: repeating-linear-gradient(0deg, #c41e3a, #c41e3a 5px, #d42a4a 5px, #d42a4a 10px);"
      >
        <div class="absolute inset-0" style="background: repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(255,255,255,0.2) 7px, rgba(255,255,255,0.2) 8px);"></div>
        <div class="absolute inset-0" style="background: repeating-linear-gradient(-45deg, transparent, transparent 7px, rgba(255,255,255,0.2) 7px, rgba(255,255,255,0.2) 8px);"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-[44%] h-[54%] rounded-[50%] border-[1.5px] border-white/30 flex items-center justify-center bg-white/5">
            <div class="w-[68%] h-[68%] rounded-[50%] border border-white/20 flex items-center justify-center">
              <span class="text-white/40 font-black text-base select-none">♠</span>
            </div>
          </div>
        </div>
        <div class="absolute top-[5%] left-[6%] text-white/30 text-[8px]">❀</div>
        <div class="absolute top-[5%] right-[6%] text-white/30 text-[8px]">❀</div>
        <div class="absolute bottom-[5%] left-[6%] text-white/30 text-[8px] rotate-180">❀</div>
        <div class="absolute bottom-[5%] right-[6%] text-white/30 text-[8px] rotate-180">❀</div>
      </div>
    </div>

    <!-- 牌面 - 外部高清图片 -->
    <div v-else
      class="w-full h-full rounded-xl overflow-hidden relative shadow-md bg-white"
      :class="cardFaceGlowClass"
    >
      <!-- 扑克牌图片 -->
      <img
        v-if="card && cardImageUrl"
        :src="cardImageUrl"
        :alt="card?.display"
        class="w-full h-full object-cover select-none"
        loading="lazy"
        draggable="false"
      />

      <!-- 分值叠加 -->
      <div v-if="showScore && card && card.scoreValue > 0"
        class="absolute bottom-[5px] left-1/2 -translate-x-1/2 text-[7px] md:text-[8px] font-bold px-1.5 py-[2px] rounded z-20 whitespace-nowrap"
        :class="size === 'sm' ? 'hidden' : ''"
        style="color: #3a2000; background: linear-gradient(135deg, #f5e08a, #d4af37); border: 0.5px solid #b8941f; box-shadow: 0 1px 4px rgba(0,0,0,0.25);"
      >
        {{ card.scoreValue }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, Rank, Suit } from '@/engine'

const props = defineProps<{
  card?: Card
  isFaceDown?: boolean
  isSelected?: boolean
  size?: 'sm' | 'md' | 'lg'
  marginLeft?: string
  showScore?: boolean
}>()

defineEmits<{ click: []; dblclick: [] }>()

/** 生成外部扑克牌图片 URL (deckofcardsapi) */
const cardImageUrl = computed(() => {
  if (!props.card) return ''
  const rankMap: Record<number, string> = {
    [Rank.A]: 'A',
    [Rank.Two]: '2',
    [Rank.Three]: '3',
    [Rank.Four]: '4',
    [Rank.Five]: '5',
    [Rank.Six]: '6',
    [Rank.Seven]: '7',
    [Rank.Eight]: '8',
    [Rank.Nine]: '9',
    [Rank.Ten]: '0',
    [Rank.Jack]: 'J',
    [Rank.Queen]: 'Q',
    [Rank.King]: 'K',
  }
  const suitMap: Record<string, string> = {
    [Suit.Spade]: 'S',
    [Suit.Heart]: 'H',
    [Suit.Diamond]: 'D',
    [Suit.Club]: 'C',
  }
  const r = rankMap[props.card.rank]
  const s = suitMap[props.card.suit]
  if (!r || !s) return ''
  return `https://deckofcardsapi.com/static/img/${r}${s}.png`
})

const cardBackGlowClass = computed(() => {
  if (props.isSelected) {
    return 'ring-2 ring-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.5)]'
  }
  return 'border border-gray-500/40'
})

const cardFaceGlowClass = computed(() => {
  if (props.isSelected) {
    return 'ring-2 ring-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.5)]'
  }
  return ''
})
</script>

<style scoped>
.card-item {
  perspective: 600px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
}

.card-interactive:hover:not(.card-selected) {
  transform: translateY(-10px) scale(1.06) rotateZ(-1deg);
  z-index: 10;
}

.card-interactive:active:not(.card-selected) {
  transform: translateY(-2px) scale(0.98);
  transition-duration: 0.08s;
}
</style>
