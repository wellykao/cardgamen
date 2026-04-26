<template>
  <button
    :class="[
      variant === 'gold' ? 'btn-gold' : 'btn-dark',
      size === 'lg' ? 'px-8 py-4 text-base' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-6 py-3 text-sm',
      'inline-flex items-center justify-center gap-2',
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'gold' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
