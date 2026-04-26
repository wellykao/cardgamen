<template>
  <div
    class="w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300"
    :class="[
      isActive ? 'border-gold-light turn-highlight' : 'border-white/30',
      size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-12 h-12',
    ]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="w-full h-full object-cover"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center bg-accent-emerald text-white font-bold"
      :class="size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm'"
    >
      {{ name?.charAt(0) || '?' }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string
  name?: string
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}>()
</script>
