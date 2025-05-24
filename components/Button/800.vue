<template>
  <button
    class="px-3 pb-1 rounded-lg h-7 font-semibold"
    :class="{
      'bg-coffee-800 text-coffee-300 hover:bg-coffee-850 hover:text-coffee-200':
        !disabled && !active,
      'cursor-default': disabled || active,
      'bg-coffee-750 text-coffee-450': disabled,
      'bg-carrot-400 text-carrot-800': active,
    }"
    :disabled="disabled || active"
  >
    <slot />
  </button>
</template>
<script setup>
const props = defineProps(["disabled", "active"])
</script>
