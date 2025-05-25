<template>
  <button
    class="px-3 pb-1 rounded-lg h-7 font-semibold relative overflow-hidden"
    :class="{
      'bg-coffee-800 text-coffee-300 hover:bg-coffee-850 hover:text-coffee-200 inner-shadow':
        !disabled && !active,
      'cursor-default': disabled || active,
      'bg-coffee-750 text-coffee-550 blur-[0.3px]': disabled,
      'bg-carrot-400 text-amber-900': active,
    }"
    :disabled="disabled || active"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps(["disabled", "active"])
</script>

<style scoped>
.inner-shadow {
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
