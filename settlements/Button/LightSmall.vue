<template>
  <button
    class="px-2 rounded-lg min-w-[50px] text-sm h-6 pb-2"
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
