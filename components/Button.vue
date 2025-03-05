<template>
  <button
    :class="{
      'min-w-24 px-4 bg-stone-600 text-stone-400 pb-1 rounded-lg':
        theme === 'light',
      'w-full pb-1 text-stone-400 bg-stone-700': theme === 'dark',
      'cursor-default text-stone-500/60': theme === 'light' && disabled,
      'hover:bg-stone-500 hover:text-stone-200': theme === 'light' && !disabled,
      'cursor-default text-stone-500/60': theme === 'dark' && disabled,
      'hover:bg-stone-800 hover:text-stone-300': theme === 'dark' && !disabled,
    }"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["disabled", "theme"])
</script>
