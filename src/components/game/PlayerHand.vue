<template>
  <div class="player-hand flex items-end" :class="position === 'bottom' ? 'justify-center' : 'justify-center'">
    <div class="flex" :class="position === 'bottom' ? 'flex-row' : 'flex-row'">
      <CardItem
        v-for="(card, index) in cards"
        :key="card.id"
        :card="position === 'bottom' ? card : undefined"
        :is-face-down="position !== 'bottom'"
        :is-selected="position === 'bottom' && selectedCardId === card.id"
        :size="position === 'bottom' ? 'md' : 'sm'"
        :margin-left="index > 0 ? (position === 'bottom' ? '-18px' : '-24px') : '0'"
        :show-score="position === 'bottom'"
        @click="position === 'bottom' && $emit('selectCard', card.id)"
        @dblclick="position === 'bottom' && $emit('playCard', card.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from '@/engine'
import CardItem from './CardItem.vue'

defineProps<{
  cards: Card[]
  position: 'bottom' | 'top' | 'left' | 'right'
  selectedCardId?: string | null
}>()

defineEmits<{
  selectCard: [cardId: string]
  playCard: [cardId: string]
}>()
</script>
