<template>
  <div class="action-panel flex flex-col items-center gap-2 py-2 px-4">
    <!-- 弃牌重置按钮 -->
    <template v-if="showDiscardReset">
      <div class="flex items-center gap-3">
        <BaseButton variant="gold" size="md" @click="$emit('discardReset')">
          重新发牌
        </BaseButton>
        <BaseButton variant="dark" size="md" @click="$emit('declineDiscard')">
          继续游戏
        </BaseButton>
      </div>
    </template>

    <!-- 等待收牌选择 -->
    <template v-else-if="awaitingCollectChoice">
      <div class="text-center px-5 py-2.5 neon-panel animate-pulse">
        <div class="text-[#39ff14] text-sm font-black tracking-wide">🎯 请选择收哪张牌</div>
        <div class="text-white/40 text-[11px] mt-0.5">点击桌面上绿色高亮的牌</div>
      </div>
    </template>

    <!-- 出牌按钮 + 提示 -->
    <template v-else-if="isMyTurn && !isAnimating">
      <div class="flex flex-col items-center gap-1.5">
        <div class="flex items-center gap-2 text-[10px] text-[#ffd700]/70 font-bold tracking-wider uppercase">
          <span class="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-pulse" />
          你的回合
        </div>
        <button
          class="relative px-10 py-3 rounded-xl font-black text-sm cursor-pointer transition-all duration-150"
          :class="selectedCardId
            ? 'bg-gradient-to-b from-[#ffea70] to-[#c9a000] text-[#1a0a00] border-2 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.4),0_4px_0_#8a7000] hover:shadow-[0_0_35px_rgba(255,215,0,0.6),0_6px_0_#8a7000] hover:-translate-y-1 active:translate-y-0.5'
            : 'bg-gradient-to-b from-[#2a2a4a] to-[#1a1a2e] text-[#555570] border-2 border-[#3a3a5a] shadow-[0_3px_0_#0a0a1e]'
          "
          :disabled="!selectedCardId"
          @click="selectedCardId && $emit('playCard', selectedCardId)"
        >
          {{ selectedCardId ? '✓ 确认出牌' : '选择手牌' }}
        </button>
        <div class="text-white/25 text-[10px] font-medium">
          <template v-if="selectedCardId">
            按 <kbd class="px-1 py-0.5 rounded bg-white/10 text-white/50 text-[9px] mx-0.5">空格</kbd> 或双击出牌
          </template>
          <template v-else>
            点击手牌选中，← → 切换
          </template>
        </div>
      </div>
    </template>

    <!-- AI回合提示 -->
    <template v-else-if="isAnimating">
      <div class="flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel">
        <div class="w-4 h-4 border-2 border-[#00d4ff]/40 border-t-[#00d4ff] rounded-full animate-spin" />
        <span class="text-white/50 text-sm font-bold">对手思考中...</span>
      </div>
    </template>

    <template v-else-if="!isMyTurn">
      <div class="flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
        <div class="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
        <span class="text-white/30 text-sm font-bold">等待对手出牌</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isMyTurn: boolean
  isAnimating: boolean
  selectedCardId: string | null
  showDiscardReset: boolean
  awaitingCollectChoice?: boolean
}>()

defineEmits<{
  playCard: [cardId: string]
  discardReset: []
  declineDiscard: []
}>()
</script>
