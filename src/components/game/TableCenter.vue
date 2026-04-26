<template>
  <div class="table-center relative flex flex-col items-center justify-center min-h-[220px]">
    <!-- 桌面圆形焦点背景 -->
    <div class="absolute w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full border border-white/5 pointer-events-none"
      style="background: radial-gradient(circle, rgba(0,212,255,0.03) 0%, transparent 70%);"
    />

    <!-- 桌面牌区域 -->
    <div class="flex flex-wrap justify-center gap-3 max-w-[440px] px-4 relative z-10">
      <TransitionGroup name="card-appear">
        <CardItem
          v-for="card in tableCards"
          :key="card.id"
          :card="card"
          size="md"
          :class="{
            'ring-2 ring-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.6)] animate-pulse z-20': isHighlightedCard(card.id),
            'ring-2 ring-[#39ff14] cursor-pointer hover:scale-110 shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-transform duration-150 z-20': isClickableCard(card.id),
          }"
          @click="handleCardClick(card.id)"
        />
      </TransitionGroup>
    </div>

    <!-- 空桌面提示 -->
    <div v-if="tableCards.length === 0" class="relative z-10 text-white/15 text-sm font-bold tracking-widest flex flex-col items-center gap-2">
      <div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
        <span class="text-xl opacity-50">🃏</span>
      </div>
      <span>桌面无牌</span>
    </div>

    <!-- 剩余牌数 -->
    <div class="absolute top-2 right-3 md:right-6 z-10">
      <div class="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg">
        <span class="text-white/50 text-xs">剩余</span>
        <span class="text-sm font-black text-[#ffd700] tabular-nums">{{ deckRemaining }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from '@/engine'
import CardItem from './CardItem.vue'

const props = defineProps<{
  tableCards: Card[]
  deckRemaining: number
  highlightedCardIds?: string[]
  clickableCardIds?: string[]
}>()

const emit = defineEmits<{
  selectTableCard: [cardId: string]
}>()

function isHighlightedCard(cardId: string): boolean {
  return props.highlightedCardIds?.includes(cardId) ?? false
}

function isClickableCard(cardId: string): boolean {
  return props.clickableCardIds?.includes(cardId) ?? false
}

function handleCardClick(cardId: string) {
  if (isClickableCard(cardId)) {
    emit('selectTableCard', cardId)
  }
}
</script>

<style scoped>
.card-appear-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-appear-enter-from {
  opacity: 0;
  transform: scale(0.2) translateY(60px) rotate(-15deg);
}
.card-appear-move {
  transition: transform 0.3s ease;
}
</style>
