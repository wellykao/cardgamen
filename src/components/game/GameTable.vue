<template>
  <div class="game-table table-bg w-full h-full relative overflow-hidden select-none">
    <!-- ====== 顶部栏：上方3个其他玩家座位 ====== -->
    <div class="absolute top-3 left-0 right-0 md:right-56 flex justify-around items-start px-4 z-10 gap-2">
      <PlayerSeat
        v-for="idx in otherPlayerIndices"
        :key="idx"
        :player="players[idx]"
        :is-active="currentPlayerIndex === idx"
        :is-collecting="collectingPlayerId === players[idx]?.id"
      />
    </div>

    <!-- ====== AI手牌区（上方3个玩家的牌背） ====== -->
    <div class="absolute top-24 left-0 right-0 md:right-56 flex justify-around px-6 z-[5]">
      <div v-for="idx in otherPlayerIndices" :key="idx" class="flex justify-center items-end">
        <div class="flex">
          <CardItem
            v-for="i in Math.min(players[idx]?.hand?.length || 0, 6)"
            :key="'ai-' + idx + '-' + i"
            is-face-down
            size="sm"
            :margin-left="i > 1 ? '-20px' : '0'"
          />
        </div>
        <div v-if="(players[idx]?.hand?.length || 0) > 6" class="text-[#00d4ff]/40 text-[10px] ml-1 self-end mb-1 font-bold">
          +{{ (players[idx]?.hand?.length || 0) - 6 }}
        </div>
      </div>
    </div>

    <!-- ====== 中央桌面 ====== -->
    <div class="absolute inset-0 flex items-center justify-center pb-40 md:pb-36 md:right-56 z-[2]">
      <TableCenter
        :table-cards="tableCards"
        :deck-remaining="deckRemaining"
        :highlighted-card-ids="highlightedCardIds"
        :clickable-card-ids="clickableCardIds"
        @select-table-card="$emit('selectTableCard', $event)"
      />
    </div>

    <!-- ====== 右侧面板（桌面端） ====== -->
    <div class="hidden md:flex absolute right-0 top-0 bottom-0 w-56 z-10 flex-col gap-2 p-3">
      <ScoreBoard :players="players" :current-id="currentPlayerIndex" />
      <OperationLog :logs="logs" :collapsed="logCollapsed" class="flex-1 min-h-0" @toggle="logCollapsed = !logCollapsed" />
    </div>

    <!-- ====== 移动端顶部日志切换按钮 ====== -->
    <button
      class="md:hidden absolute top-3 right-3 z-20 glass-panel px-3 py-1.5 text-[10px] text-[#00d4ff]/80 cursor-pointer font-bold rounded-full"
      @click="showMobileLog = !showMobileLog"
    >
      📋 记录
    </button>

    <!-- 移动端日志弹窗 -->
    <BaseModal v-model="showMobileLog" title="操作记录" closeable>
      <div class="max-h-[60vh] overflow-y-auto">
        <OperationLog :logs="logs" :collapsed="false" />
      </div>
    </BaseModal>

    <!-- ====== 底部：自己手牌 + 操作面板 ====== -->
    <div class="absolute bottom-0 left-0 right-0 z-10 pb-safe">
      <!-- 自己座位 + 倒计时 -->
      <div class="flex items-center justify-center gap-3 mb-1.5">
        <PlayerSeat
          :player="players[myPlayerIndex]"
          :is-active="currentPlayerIndex === myPlayerIndex"
          :is-collecting="collectingPlayerId === players[myPlayerIndex]?.id"
        />
        <TurnTimer
          v-if="currentPlayerIndex === myPlayerIndex && phase === 'playing'"
          :time-left="turnTimerValue"
          :max-time="30"
        />
      </div>

      <!-- 手牌 -->
      <div class="flex justify-center px-3 mb-1 overflow-x-auto pb-1 scrollbar-hide">
        <PlayerHand
          :cards="players[myPlayerIndex]?.hand || []"
          position="bottom"
          :selected-card-id="selectedCardId"
          :recommended-card-id="recommendedCardId"
          @select-card="$emit('selectCard', $event)"
          @play-card="$emit('playCard', $event)"
        />
      </div>

      <!-- 操作面板 -->
      <ActionPanel
        :is-my-turn="currentPlayerIndex === myPlayerIndex"
        :is-animating="isAnimating"
        :selected-card-id="selectedCardId"
        :show-discard-reset="showDiscardReset"
        :awaiting-collect-choice="awaitingCollectChoice"
        @play-card="$emit('playCard', $event)"
        @discard-reset="$emit('discardReset')"
        @decline-discard="$emit('declineDiscard')"
      />
    </div>

    <!-- 分数浮动提示 -->
    <ScorePopup ref="scorePopup" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Player, Card, LogEntry, GamePhase } from '@/engine'
import PlayerSeat from './PlayerSeat.vue'
import PlayerHand from './PlayerHand.vue'
import TableCenter from './TableCenter.vue'
import OperationLog from './OperationLog.vue'
import ScoreBoard from './ScoreBoard.vue'
import TurnTimer from './TurnTimer.vue'
import ActionPanel from './ActionPanel.vue'
import ScorePopup from './ScorePopup.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const props = defineProps<{
  players: Player[]
  tableCards: Card[]
  logs: LogEntry[]
  currentPlayerIndex: number
  phase: GamePhase
  isAnimating: boolean
  selectedCardId: string | null
  showDiscardReset: boolean
  deckRemaining: number
  highlightedCardIds: string[]
  turnTimerValue: number
  clickableCardIds?: string[]
  awaitingCollectChoice?: boolean
  collectingPlayerId?: number
  recommendedCardId?: string | null
  isMultiplayer?: boolean
  myPlayerIndex?: number
}>()

defineEmits<{
  selectCard: [cardId: string]
  playCard: [cardId: string]
  discardReset: []
  declineDiscard: []
  selectTableCard: [cardId: string]
}>()

const myPlayerIndex = computed(() => props.myPlayerIndex ?? 0)

const otherPlayerIndices = computed(() => {
  const all = [0, 1, 2, 3]
  return all.filter(i => i !== myPlayerIndex.value)
})

const logCollapsed = ref(false)
const showMobileLog = ref(false)
const scorePopup = ref<InstanceType<typeof ScorePopup> | null>(null)
</script>
