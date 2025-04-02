<template>
  <button
    class="px-3 pb-1 rounded-lg min-w-[60px] h-7"
    :class="
      theme === 'darker'
        ? disabled
          ? 'cursor-default bg-stone-500 text-stone-300'
          : 'bg-stone-600 text-stone-400 hover:bg-stone-500 hover:text-stone-200'
        : disabled
        ? 'cursor-default bg-stone-400 text-stone-700'
        : 'bg-stone-600 text-stone-400 hover:bg-stone-500 hover:text-stone-200'
    "
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled", "theme"])
</script>
