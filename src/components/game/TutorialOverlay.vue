<template>
  <Transition name="fade">
    <div v-if="visible" class="fixed inset-0 z-50 pointer-events-none">
      <!-- 遮罩层（带高亮洞） -->
      <div class="absolute inset-0 bg-black/60 pointer-events-auto" @click="handleBackdropClick">
        <!-- 高亮区域 -->
        <div
          v-if="highlightRect"
          class="absolute rounded-xl pointer-events-none"
          :style="{
            left: highlightRect.left + 'px',
            top: highlightRect.top + 'px',
            width: highlightRect.width + 'px',
            height: highlightRect.height + 'px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.5)',
            border: '2px solid rgba(255,215,0,0.6)',
          }"
        />
      </div>

      <!-- 提示卡片 -->
      <div
        class="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
        :class="tipPositionClass"
        style="max-width: 340px; width: 90vw;"
      >
        <div class="glass-panel p-5 border border-[#ffd700]/30 shadow-[0_0_40px_rgba(255,215,0,0.15)] animate-pop-in">
          <!-- 步骤指示器 -->
          <div class="flex gap-1.5 mb-4 justify-center">
            <div
              v-for="(_, i) in steps"
              :key="i"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="currentStep >= i ? 'bg-[#ffd700] w-4' : 'bg-white/10 w-1.5'"
            />
          </div>

          <!-- 图标 -->
          <div class="text-4xl mb-3 text-center">{{ steps[currentStep].icon }}</div>

          <!-- 标题 -->
          <h3 class="text-lg font-black text-[#ffd700] text-center mb-2 text-glow-gold">
            {{ steps[currentStep].title }}
          </h3>

          <!-- 内容 -->
          <p class="text-white/70 text-sm leading-relaxed text-center whitespace-pre-line mb-5">
            {{ steps[currentStep].content }}
          </p>

          <!-- 操作按钮 -->
          <div class="flex justify-center gap-3">
            <button
              v-if="currentStep > 0"
              class="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10 cursor-pointer text-sm font-bold transition-all"
              @click="currentStep--"
            >
              上一步
            </button>
            <button
              class="px-6 py-2.5 rounded-xl btn-gold cursor-pointer text-sm font-black"
              @click="handleNext"
            >
              {{ currentStep < steps.length - 1 ? '知道了' : '开始游戏！' }}
            </button>
          </div>

          <!-- 跳过 -->
          <button
            class="w-full mt-3 text-white/20 hover:text-white/40 text-xs cursor-pointer transition-colors font-bold"
            @click="handleSkip"
          >
            跳过教程
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  visible: boolean
  selectedCardId?: string | null
  currentCollectPairsLength?: number
  currentFlippedCard?: any
}>()

const emit = defineEmits<{
  close: []
  stepChange: [step: number]
}>()

const currentStep = ref(0)

const steps = [
  {
    icon: '🎮',
    title: '欢迎来到台湾捡红点！',
    content: '这是一款经典的4人棋牌游戏。\n你的目标是通过出牌和收牌，\n获得比AI对手更高的分数！',
    highlight: null as string | null,
    waitForAction: false,
  },
  {
    icon: '🃏',
    title: '你的手牌',
    content: '屏幕底部是你的手牌。\n点击一张牌可以选中它，\n再次点击或按空格键出牌。',
    highlight: '.player-hand',
    waitForAction: false,
  },
  {
    icon: '📍',
    title: '桌面公共牌',
    content: '中央区域是桌面上的公共牌。\n你出的牌如果和某张桌面牌\n凑成10点或同点对子，\n就可以收走它们！',
    highlight: '.table-center',
    waitForAction: false,
  },
  {
    icon: '🤖',
    title: '你的对手',
    content: '上方3个座位是AI对手。\n他们会自动出牌、收牌。\n注意观察他们的策略！',
    highlight: '.game-table > .absolute.top-3',
    waitForAction: false,
  },
  {
    icon: '👆',
    title: '来试试出牌吧！',
    content: '现在轮到你了。\n请先选中一张手牌，\n然后点击「确认出牌」。\n（系统会自动检测是否能收牌）',
    highlight: '.player-hand',
    waitForAction: true,
  },
  {
    icon: '✨',
    title: '收牌成功！',
    content: '如果桌面有可以配对的牌，\n系统会自动帮你收走。\n凑十：A~9 两张相加=10\n对子：10/J/Q/K 同点数',
    highlight: null,
    waitForAction: false,
  },
  {
    icon: '🔄',
    title: '自动翻牌',
    content: '出牌后，系统会从牌堆\n翻一张新牌到桌面，\n并再次判定是否能收牌。',
    highlight: null,
    waitForAction: false,
  },
  {
    icon: '💎',
    title: '计分规则',
    content: '红色牌（红心/方块）有分值：\n黑桃A=30分，红桃A/方块A=20分\n红色数字牌=牌面分\n黑色牌大部分为0分',
    highlight: null,
    waitForAction: false,
  },
  {
    icon: '🎯',
    title: '推荐出牌',
    content: '开启「推荐出牌」功能后，\n手牌上会有👍标记，\n提示你当前最优的出牌选择。\n可以在设置中开关。',
    highlight: null,
    waitForAction: false,
  },
  {
    icon: '🏆',
    title: '准备好了吗？',
    content: '规则很简单：\n凑十收牌、对子收牌、红色得分！\n祝你好运，击败所有AI！',
    highlight: null,
    waitForAction: false,
  },
]

const highlightRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

const tipPositionClass = computed(() => {
  // 根据高亮位置决定提示框位置
  if (!highlightRect.value) {
    return 'top-1/2 -translate-y-1/2'
  }
  const centerY = highlightRect.value.top + highlightRect.value.height / 2
  if (centerY < window.innerHeight / 2) {
    return 'bottom-24'
  }
  return 'top-24'
})

function updateHighlight() {
  const selector = steps[currentStep.value].highlight
  if (!selector) {
    highlightRect.value = null
    return
  }
  nextTick(() => {
    const el = document.querySelector(selector) as HTMLElement | null
    if (el) {
      const rect = el.getBoundingClientRect()
      const padding = 8
      highlightRect.value = {
        left: rect.left - padding,
        top: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    } else {
      highlightRect.value = null
    }
  })
}

function handleNext() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    emit('stepChange', currentStep.value)
    updateHighlight()
  } else {
    handleSkip()
  }
}

function handleSkip() {
  localStorage.setItem('cardgame_tutorial_completed', 'true')
  emit('close')
}

function handleBackdropClick() {
  // 点击遮罩不关闭，引导用户点击按钮
}

// 监听实际操作以自动推进教程
watch(() => props.selectedCardId, (id, oldId) => {
  if (!props.visible) return
  // 步骤4：玩家选中了牌，推进到下一步
  if (currentStep.value === 4 && id && !oldId) {
    setTimeout(() => {
      currentStep.value = 5
      updateHighlight()
    }, 400)
  }
})

watch(() => props.currentCollectPairsLength, (len, oldLen) => {
  if (!props.visible) return
  // 步骤5：发生了收牌，推进到下一步
  if (currentStep.value === 5 && len && len > 0 && (!oldLen || oldLen === 0)) {
    setTimeout(() => {
      currentStep.value = 6
      updateHighlight()
    }, 1500)
  }
})

watch(() => props.currentFlippedCard, (card) => {
  if (!props.visible || !card) return
  // 步骤6：发生了翻牌，推进到下一步
  if (currentStep.value === 6) {
    setTimeout(() => {
      currentStep.value = 7
      updateHighlight()
    }, 1200)
  }
})

watch(() => props.visible, (visible) => {
  if (visible) {
    currentStep.value = 0
    updateHighlight()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
