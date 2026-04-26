<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeable && close()"
      >
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/60" />

        <!-- 弹窗内容 -->
        <div class="glass-panel relative z-10 p-6 max-w-lg w-full mx-4 animate-fade-in">
          <!-- 标题 -->
          <div v-if="title" class="text-xl font-bold text-gold-light mb-4 flex items-center justify-between">
            <span>{{ title }}</span>
            <button
              v-if="closeable"
              class="text-white/60 hover:text-white text-2xl leading-none cursor-pointer"
              @click="close"
            >&times;</button>
          </div>

          <!-- 主体 -->
          <div class="text-white/90">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title?: string
  closeable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  if (props.closeable !== false) {
    emit('update:modelValue', false)
  }
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
</style>
