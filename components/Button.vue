<template>
  <button
    class="min-w-24 px-4 bg-stone-700 text-stone-400 pb-1 rounded-lg"
    :class="[
      disabled
        ? 'cursor-default text-stone-500/60'
        : 'hover:bg-stone-800 hover:text-stone-300',
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled"])
</script>
