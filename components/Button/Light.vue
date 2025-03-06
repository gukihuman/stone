<template>
  <button
    class="min-w-24 px-4 pb-1 rounded-lg"
    :class="
      disabled
        ? 'cursor-default bg-stone-400 text-stone-700'
        : 'bg-stone-600 text-stone-400 hover:bg-stone-500 hover:text-stone-200'
    "
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled"])
</script>
