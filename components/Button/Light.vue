<template>
  <button
    class="min-w-24 px-4 bg-stone-600 text-stone-400 pb-1 rounded-lg"
    :class="
      disabled
        ? 'cursor-default text-stone-500/60'
        : 'hover:bg-stone-500 hover:text-stone-200'
    "
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled"])
</script>
