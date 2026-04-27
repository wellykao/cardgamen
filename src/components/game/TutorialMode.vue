<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col bg-[#0a0a12]">
        <!-- 顶部导航 -->
        <header class="flex items-center justify-between px-4 py-3 border-b border-white/10 z-10 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ffd700] to-[#c9a000] flex items-center justify-center text-[#1a0a00] font-black text-sm">
              📖
            </div>
            <h1 class="text-base font-black text-gold-light tracking-wide">教学模式</h1>
          </div>
          <button class="text-white/40 hover:text-white cursor-pointer transition-colors px-2 py-1" @click="close">
            ✕
          </button>
        </header>

        <!-- 主体内容 -->
        <main class="flex-1 overflow-y-auto px-4 py-5">
          <div class="max-w-lg mx-auto space-y-5">
            <!-- 步骤指示器 -->
            <div class="flex items-center justify-center gap-2 mb-2">
              <button
                v-for="(section, i) in sections"
                :key="i"
                class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                :class="currentSection >= i ? 'bg-[#ffd700] w-6' : 'bg-white/10 w-2'"
                @click="currentSection = i"
              />
            </div>

            <!-- 当前章节 -->
            <div class="animate-fade-in">
              <!-- 章节标题 -->
              <div class="text-center mb-5">
                <div class="text-4xl mb-2">{{ sections[currentSection].icon }}</div>
                <h2 class="text-xl font-black text-[#ffd700] text-glow-gold">{{ sections[currentSection].title }}</h2>
              </div>

              <!-- 章节内容 -->
              <div v-for="(block, bi) in sections[currentSection].blocks" :key="bi" class="mb-4">
                <!-- 文本块 -->
                <p v-if="block.type === 'text'" class="text-white/70 text-sm leading-relaxed whitespace-pre-line">
                  {{ block.content }}
                </p>

                <!-- 高亮提示 -->
                <div v-else-if="block.type === 'tip'" class="neon-panel p-4 border border-[#39ff14]/20">
                  <div class="flex items-start gap-2">
                    <span class="text-[#39ff14] text-lg">💡</span>
                    <p class="text-white/80 text-sm leading-relaxed">{{ block.content }}</p>
                  </div>
                </div>

                <!-- 警告 -->
                <div v-else-if="block.type === 'warning'" class="neon-panel p-4 border border-[#ff3366]/20">
                  <div class="flex items-start gap-2">
                    <span class="text-[#ff3366] text-lg">⚠️</span>
                    <p class="text-white/80 text-sm leading-relaxed">{{ block.content }}</p>
                  </div>
                </div>

                <!-- 示例牌组 -->
                <div v-else-if="block.type === 'cards'" class="glass-panel p-4">
                  <div class="text-white/50 text-xs mb-3 font-bold">{{ block.label }}</div>
                  <div class="flex justify-center gap-3 flex-wrap">
                    <div
                      v-for="(card, ci) in block.cards"
                      :key="ci"
                      class="flex flex-col items-center gap-1"
                    >
                      <div
                        class="w-12 h-16 rounded-lg flex items-center justify-center text-lg font-black shadow-md"
                        :class="card.isRed ? 'bg-white text-[#ff3366]' : 'bg-white text-black'"
                      >
                        {{ card.symbol }}
                      </div>
                      <span class="text-white/40 text-[10px]">{{ card.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- 分值表 -->
                <div v-else-if="block.type === 'scoreTable'" class="glass-panel p-4">
                  <div class="text-white/50 text-xs mb-3 font-bold">{{ block.label }}</div>
                  <div class="grid grid-cols-2 gap-2">
                    <div
                      v-for="(row, ri) in block.rows"
                      :key="ri"
                      class="flex items-center justify-between px-3 py-2 rounded-lg"
                      :class="row.highlight ? 'bg-[#ffd700]/10 border border-[#ffd700]/20' : 'bg-white/5'"
                    >
                      <span class="text-white/70 text-sm">{{ row.name }}</span>
                      <span class="text-[#ffd700] font-black text-sm">{{ row.score }}</span>
                    </div>
                  </div>
                </div>

                <!-- 流程步骤 -->
                <div v-else-if="block.type === 'steps'" class="space-y-3">
                  <div
                    v-for="(step, si) in block.steps"
                    :key="si"
                    class="flex items-start gap-3 glass-panel p-3"
                  >
                    <div class="w-7 h-7 rounded-full bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center text-xs font-black shrink-0">
                      {{ si + 1 }}
                    </div>
                    <div>
                      <div class="text-white/80 text-sm font-bold">{{ step.title }}</div>
                      <div class="text-white/50 text-xs mt-0.5">{{ step.desc }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- 底部导航 -->
        <footer class="shrink-0 px-4 py-3 border-t border-white/10">
          <div class="max-w-lg mx-auto flex justify-between items-center">
            <button
              v-if="currentSection > 0"
              class="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 cursor-pointer text-sm font-bold transition-all"
              @click="currentSection--"
            >
              ← 上一章
            </button>
            <div v-else />

            <div class="text-white/30 text-xs font-bold">
              {{ currentSection + 1 }} / {{ sections.length }}
            </div>

            <button
              v-if="currentSection < sections.length - 1"
              class="px-5 py-2.5 rounded-xl btn-gold cursor-pointer text-sm font-black"
              @click="currentSection++"
            >
              下一章 →
            </button>
            <button
              v-else
              class="px-5 py-2.5 rounded-xl btn-gold cursor-pointer text-sm font-black"
              @click="close"
            >
              完成学习 ✓
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const currentSection = ref(0)

const sections = [
  {
    icon: '🎯',
    title: '游戏目标',
    blocks: [
      { type: 'text', content: '台湾捡红点是一款4人扑克牌游戏。\n\n你的目标是通过出牌和收牌，收集尽可能多的红色牌（红心、方块），最终获得最高分数击败AI对手。' },
      { type: 'tip', content: '红色牌有分值，黑色牌大部分为0分。优先收集红色高分牌是获胜关键！' },
    ],
  },
  {
    icon: '🔄',
    title: '游戏流程',
    blocks: [
      {
        type: 'steps',
        steps: [
          { title: '发牌', desc: '每人6张手牌，桌面4张公共牌' },
          { title: '出牌', desc: '轮到你时，选中1张手牌打出到桌面' },
          { title: '判定收牌', desc: '系统检查你的牌能否和桌面牌配对收取' },
          { title: '自动翻牌', desc: '从牌堆翻1张新牌，再次判定收牌' },
          { title: '回合结束', desc: '轮到下一位玩家（逆时针）' },
        ],
      },
      { type: 'text', content: '游戏持续进行，直到所有牌打完或某玩家达到胜利条件。' },
    ],
  },
  {
    icon: '🔢',
    title: '凑十规则（A~9）',
    blocks: [
      { type: 'text', content: '当你打出一张数字牌（A~9）时，如果桌面上有另一张牌，使得两张牌的点数相加等于10，你就可以同时收走这两张牌。' },
      {
        type: 'cards',
        label: '凑十示例',
        cards: [
          { symbol: '♦3', isRed: true, label: '你出的牌' },
          { symbol: '+', isRed: true, label: '' },
          { symbol: '♥7', isRed: true, label: '桌面牌' },
          { symbol: '=', isRed: true, label: '' },
          { symbol: '✓', isRed: true, label: '成功收牌！' },
        ],
      },
      { type: 'tip', content: 'A算作1点。例如：A + 9 = 10，2 + 8 = 10，3 + 7 = 10...' },
      { type: 'warning', content: '10、J、Q、K不能用于凑十！它们只能和同点数的牌组成对子收取。' },
    ],
  },
  {
    icon: '👑',
    title: '对子规则（10/J/Q/K）',
    blocks: [
      { type: 'text', content: '10、J、Q、K这四类牌（统称为"十点牌"）比较特殊：它们不能和普通数字牌凑十，只能和相同点数的牌组成对子收取。' },
      {
        type: 'cards',
        label: '对子示例',
        cards: [
          { symbol: '♠K', isRed: false, label: '你出的K' },
          { symbol: '+', isRed: false, label: '' },
          { symbol: '♥K', isRed: true, label: '桌面的K' },
          { symbol: '=', isRed: false, label: '' },
          { symbol: '✓', isRed: true, label: '成功收牌！' },
        ],
      },
      { type: 'tip', content: 'J只能收J，Q只能收Q，K只能收K，10只能收10。不同点数之间不能配对。' },
    ],
  },
  {
    icon: '💎',
    title: '双红5（特殊规则）',
    blocks: [
      { type: 'text', content: '当你同时收走红桃5和方块5（双红5）时，触发特殊奖励规则！' },
      {
        type: 'cards',
        label: '双红5',
        cards: [
          { symbol: '♥5', isRed: true, label: '红桃5' },
          { symbol: '+', isRed: true, label: '' },
          { symbol: '♦5', isRed: true, label: '方块5' },
          { symbol: '=', isRed: true, label: '' },
          { symbol: '🎉', isRed: true, label: '特殊奖励！' },
        ],
      },
      { type: 'tip', content: '触发效果：你额外获得30分，其余3名玩家各扣10分！这是一个逆转局势的强大combo。' },
      { type: 'warning', content: '注意：必须是红桃5 + 方块5，如果其中一张是黑色5则不会触发。' },
    ],
  },
  {
    icon: '🔄',
    title: '弃牌重置',
    blocks: [
      { type: 'text', content: '在特定条件下，你可以选择重新发牌（弃牌重置）。这会在开局时检测。' },
      {
        type: 'steps',
        steps: [
          { title: '条件一：全黑牌', desc: '你的6张手牌全部是黑色（梅花或黑桃）' },
          { title: '条件二：四张同点数', desc: '你的手牌 + 桌面牌中，存在4张相同点数的牌' },
        ],
      },
      { type: 'tip', content: '满足任一条件时，系统会询问你是否重新发牌。重新发牌后牌局重新开始，弃牌重置条件会再次检测。' },
    ],
  },
  {
    icon: '💰',
    title: '计分规则',
    blocks: [
      { type: 'text', content: '游戏结束时，根据你收集的牌计算总分。总分240分，基准分60分。' },
      {
        type: 'scoreTable',
        label: '各牌分值',
        rows: [
          { name: '黑桃A', score: '30分', highlight: true },
          { name: '红桃A / 方块A', score: '20分', highlight: true },
          { name: '梅花A', score: '0分', highlight: false },
          { name: '红色2~8', score: '牌面分', highlight: false },
          { name: '红色9/10/J/Q/K', score: '10分', highlight: false },
          { name: '黑色牌（除黑桃A）', score: '0分', highlight: false },
        ],
      },
      { type: 'tip', content: '黑桃A是全场最高分的单张牌（30分），其次是红桃A和方块A（20分）。' },
    ],
  },
  {
    icon: '🏆',
    title: '胜利条件',
    blocks: [
      { type: 'text', content: '满足以下任一条件即可直接获胜：' },
      {
        type: 'steps',
        steps: [
          { title: '满分胜利', desc: '达到240分（收走所有红色牌）' },
          { title: '零分胜利', desc: '最终得分为0分（特殊结算规则）' },
          { title: '常规胜利', desc: '牌局结束后，总分最高的玩家获胜' },
        ],
      },
      { type: 'tip', content: '如果你看到对手分数暴涨，不要慌！合理保留高分牌，在最后几轮收牌也能逆转局势。' },
    ],
  },
]

function close() {
  currentSection.value = 0
  emit('update:modelValue', false)
}
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.4s ease;
}
</style>
