<template>
  <div class="action-panel flex flex-col items-center gap-1 py-2">
    <!-- 弃牌重置按钮 -->
    <template v-if="showDiscardReset">
      <BaseButton variant="gold" size="md" @click="$emit('discardReset')">
        重新发牌
      </BaseButton>
      <BaseButton variant="dark" size="md" @click="$emit('declineDiscard')">
        继续游戏
      </BaseButton>
    </template>

    <!-- 出牌按钮 + 提示 -->
    <template v-else-if="isMyTurn && !isAnimating">
      <div class="flex items-center gap-3">
        <div class="text-center">
          <div class="text-gold-light text-xs mb-1 font-medium">👆 你的回合</div>
          <BaseButton
            variant="gold"
            size="lg"
            :disabled="!selectedCardId"
            @click="selectedCardId && $emit('playCard', selectedCardId)"
          >
            {{ selectedCardId ? '✓ 确认出牌' : '先选择一张手牌' }}
          </BaseButton>
          <div v-if="!selectedCardId" class="text-white/40 text-[11px] mt-1">点击下方手牌选中</div>
        </div>
      </div>
    </template>

    <!-- AI回合提示 -->
    <template v-else-if="isAnimating">
      <div class="text-white/50 text-sm flex items-center gap-2">
        <div class="w-4 h-4 border-2 border-gold/50 border-t-gold rounded-full animate-spin" />
        对手出牌中...
      </div>
    </template>

    <template v-else-if="!isMyTurn">
      <div class="text-white/40 text-sm">⏳ 等待对手出牌...</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'

defineProps<{
  isMyTurn: boolean
  isAnimating: boolean
  selectedCardId: string | null
  showDiscardReset: boolean
}>()

defineEmits<{
  playCard: [cardId: string]
  discardReset: []
  declineDiscard: []
}>()
</script>
