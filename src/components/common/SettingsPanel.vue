<template>
  <div class="settings-panel space-y-5">
    <!-- 音效开关 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-sm">音效</div>
        <div class="text-white/40 text-xs">出牌、收牌、翻牌音效</div>
      </div>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
        :class="settingsStore.isSoundEnabled
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'"
        @click="settingsStore.toggleSound()"
      >
        {{ settingsStore.isSoundEnabled ? '开启' : '关闭' }}
      </button>
    </div>

    <!-- 音量 -->
    <div v-if="settingsStore.isSoundEnabled" class="flex items-center justify-between">
      <span class="text-white/60 text-sm">音量</span>
      <input
        type="range"
        min="0" max="1" step="0.1"
        :value="settingsStore.soundVolume"
        @input="settingsStore.setSoundVolume(Number(($event.target as HTMLInputElement).value))"
        class="w-28 accent-gold"
      />
    </div>

    <!-- 动画速度 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-sm">动画速度</div>
        <div class="text-white/40 text-xs">调整出牌和收牌动画速度</div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="speed in speedOptions"
          :key="speed.value"
          class="px-3 py-1 rounded text-xs cursor-pointer transition-all"
          :class="settingsStore.animationSpeed === speed.value
            ? 'bg-gold/20 text-gold-light border border-gold/30'
            : 'bg-white/5 text-white/50 border border-white/10'"
          @click="settingsStore.setAnimationSpeed(speed.value)"
        >
          {{ speed.label }}
        </button>
      </div>
    </div>

    <!-- 日志面板 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-sm">操作日志</div>
        <div class="text-white/40 text-xs">右侧操作记录面板</div>
      </div>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
        :class="settingsStore.showLogPanel
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'"
        @click="settingsStore.toggleLogPanel()"
      >
        {{ settingsStore.showLogPanel ? '显示' : '隐藏' }}
      </button>
    </div>

    <!-- 分数浮动 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-sm">分数浮动提示</div>
        <div class="text-white/40 text-xs">收牌后分数变动动画</div>
      </div>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
        :class="settingsStore.showScorePopup
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'"
        @click="settingsStore.toggleScorePopup()"
      >
        {{ settingsStore.showScorePopup ? '显示' : '隐藏' }}
      </button>
    </div>

    <!-- 推荐出牌 -->
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-sm">推荐出牌</div>
        <div class="text-white/40 text-xs">高亮显示建议出的牌</div>
      </div>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
        :class="settingsStore.showHint
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'"
        @click="settingsStore.toggleHint()"
      >
        {{ settingsStore.showHint ? '开启' : '关闭' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

const speedOptions = [
  { label: '快', value: 0.5 },
  { label: '正常', value: 1.0 },
  { label: '慢', value: 1.5 },
]
</script>
