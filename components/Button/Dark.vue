<template>
  <button
    class="min-w-20 px-2 pb-1 text-stone-400 bg-stone-700"
    :class="
      disabled
        ? 'cursor-default text-stone-500/60'
        : 'hover:bg-stone-800 hover:text-stone-300'
    "
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled"])
</script>
