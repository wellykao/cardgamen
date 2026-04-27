<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="text-center">
        <!-- 摇骰子动画 -->
        <template v-if="phase === 'rolling'">
          <div class="flex items-center justify-center gap-6 mb-6">
            <div class="dice animate-roll" :style="{ animationDelay: '0ms' }">
              <div class="dice-face">{{ displayDice1 }}</div>
            </div>
            <div class="dice animate-roll" :style="{ animationDelay: '100ms' }">
              <div class="dice-face">{{ displayDice2 }}</div>
            </div>
          </div>
          <div class="text-white/60 text-sm font-bold tracking-widest animate-pulse">
            🎲 摇骰子决定先手...
          </div>
        </template>

        <!-- 结果展示 -->
        <template v-else>
          <div class="animate-pop-in">
            <div class="flex items-center justify-center gap-6 mb-6">
              <div class="dice dice-result">
                <div class="dice-face">{{ dice1 }}</div>
              </div>
              <div class="text-white/40 text-xl font-black">+</div>
              <div class="dice dice-result">
                <div class="dice-face">{{ dice2 }}</div>
              </div>
            </div>
            <div class="text-2xl font-black text-[#ffd700] text-glow-gold mb-2">
              掷出 {{ dice1 + dice2 }} 点
            </div>
            <div class="text-white/70 text-base font-bold mb-1">
              {{ firstPlayerName }} 先手！
            </div>
            <div class="text-white/40 text-xs">
              {{ firstPlayerId === 0 ? '轮到你了，准备出牌！' : '等待对手出牌...' }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  playerNames: string[]
}>()

const emit = defineEmits<{
  complete: [firstPlayerId: number]
}>()

const phase = ref<'rolling' | 'result'>('rolling')
const dice1 = ref(1)
const dice2 = ref(1)
const displayDice1 = ref('🎲')
const displayDice2 = ref('🎲')
const firstPlayerId = ref(0)

const firstPlayerName = computed(() => {
  return props.playerNames[firstPlayerId.value] || '未知'
})

let rollTimer: ReturnType<typeof setInterval> | null = null
let resultTimer: ReturnType<typeof setTimeout> | null = null

function startRoll() {
  phase.value = 'rolling'
  firstPlayerId.value = 0

  // 骰子快速变化动画
  let count = 0
  if (rollTimer) clearInterval(rollTimer)
  rollTimer = setInterval(() => {
    displayDice1.value = String(Math.floor(Math.random() * 6) + 1)
    displayDice2.value = String(Math.floor(Math.random() * 6) + 1)
    count++
    if (count >= 15) {
      if (rollTimer) clearInterval(rollTimer)
      showResult()
    }
  }, 100)
}

function showResult() {
  // 确定最终结果
  dice1.value = Math.floor(Math.random() * 6) + 1
  dice2.value = Math.floor(Math.random() * 6) + 1
  firstPlayerId.value = (dice1.value + dice2.value) % 4

  phase.value = 'result'

  // 2秒后通知父组件
  if (resultTimer) clearTimeout(resultTimer)
  resultTimer = setTimeout(() => {
    emit('complete', firstPlayerId.value)
  }, 2000)
}

watch(() => props.visible, (visible) => {
  if (visible) {
    startRoll()
  } else {
    if (rollTimer) clearInterval(rollTimer)
    if (resultTimer) clearTimeout(resultTimer)
    phase.value = 'rolling'
  }
}, { immediate: true })
</script>

<style scoped>
.dice {
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, #ffffff, #e0e0e0);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 0 #b0b0b0,
    0 8px 20px rgba(0, 0, 0, 0.3);
}

.dice-face {
  font-size: 28px;
  font-weight: 900;
  color: #333;
}

.dice-result {
  background: linear-gradient(145deg, #fff8dc, #ffd700);
  box-shadow:
    0 4px 0 #c9a000,
    0 0 30px rgba(255, 215, 0, 0.4);
}

.dice-result .dice-face {
  color: #1a0a00;
}

@keyframes roll {
  0% { transform: rotateX(0deg) rotateY(0deg) scale(1); }
  25% { transform: rotateX(180deg) rotateY(90deg) scale(1.1); }
  50% { transform: rotateX(360deg) rotateY(180deg) scale(1); }
  75% { transform: rotateX(540deg) rotateY(270deg) scale(1.1); }
  100% { transform: rotateX(720deg) rotateY(360deg) scale(1); }
}

.animate-roll {
  animation: roll 0.4s ease-in-out infinite;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
