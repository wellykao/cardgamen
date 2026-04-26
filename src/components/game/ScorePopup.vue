<template>
  <Teleport to="body">
    <div class="score-popup-container">
      <TransitionGroup name="popup">
        <div
          v-for="popup in popups"
          :key="popup.id"
          class="fixed z-50 font-bold text-xl animate-float-up pointer-events-none"
          :class="popup.value > 0 ? 'text-green-400' : 'text-red-400'"
          :style="{ left: popup.x + 'px', top: popup.y + 'px' }"
        >
          {{ popup.value > 0 ? '+' : '' }}{{ popup.value }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Popup {
  id: number
  value: number
  x: number
  y: number
}

const popups = ref<Popup[]>([])
let idCounter = 0

function show(value: number, x: number, y: number) {
  const id = ++idCounter
  popups.value.push({ id, value, x, y })
  setTimeout(() => {
    popups.value = popups.value.filter(p => p.id !== id)
  }, 1500)
}

defineExpose({ show })
</script>

<style scoped>
.popup-enter-active { transition: all 0.3s ease; }
.popup-leave-active { transition: all 1s ease; }
.popup-enter-from { opacity: 0; transform: translateY(10px); }
.popup-leave-to { opacity: 0; transform: translateY(-60px); }
</style>
