<template>
  <div class="operation-log glass-panel p-3 h-full flex flex-col">
    <div class="text-xs font-bold text-gold-light mb-2 flex items-center justify-between">
      <span>操作记录</span>
      <button
        class="text-white/40 hover:text-white/80 text-[10px] cursor-pointer"
        @click="$emit('toggle')"
      >
        {{ collapsed ? '展开' : '收起' }}
      </button>
    </div>

    <div v-if="!collapsed" ref="logContainer" class="flex-1 overflow-y-auto log-scroll space-y-1 min-h-0">
      <div
        v-for="log in logs"
        :key="log.id"
        class="text-[11px] leading-relaxed py-0.5 border-b border-white/5 last:border-0"
        :class="getLogClass(log.type)"
      >
        <span class="text-white/30 text-[10px]">
          {{ formatTime(log.timestamp) }}
        </span>
        <span class="ml-1">{{ log.message }}</span>
      </div>

      <!-- 空日志 -->
      <div v-if="logs.length === 0" class="text-white/20 text-center py-4 text-xs">
        暂无操作记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { LogEntry } from '@/engine'

const props = defineProps<{
  logs: LogEntry[]
  collapsed?: boolean
}>()

defineEmits<{
  toggle: []
}>()

const logContainer = ref<HTMLElement | null>(null)

// 自动滚动到底部
watch(() => props.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})

function getLogClass(type: LogEntry['type']): string {
  const map: Record<string, string> = {
    playCard: 'text-blue-300',
    collectCard: 'text-green-300',
    flipCard: 'text-yellow-300',
    scoreChange: 'text-amber-300',
    turnChange: 'text-purple-300',
    system: 'text-white/50',
    discardReset: 'text-red-300',
  }
  return map[type] || 'text-white/60'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>
