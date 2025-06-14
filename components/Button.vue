// ~/components/Button/Stateful.vue
<template>
  <button
    class="rounded-lg h-7 font-semibold relative overflow-hidden flex items-center justify-center gap-2"
    :class="{
      'bg-coffee-800 text-coffee-300 hover:bg-coffee-850 hover:text-coffee-200 inner-shadow':
        !disabled && !active,
      'cursor-default': disabled || (active && lockActive),
      'bg-coffee-750 text-coffee-550 blur-[0.3px]': disabled,
      'bg-carrot-400 text-amber-900': active,
    }"
    :disabled="disabled || (active && lockActive)"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps(["disabled", "active", "lockActive"])
</script>

<style scoped>
.inner-shadow {
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
