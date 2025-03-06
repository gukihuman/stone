<template>
  <button
    class="h-7 bg-stone-700 pt-[3px] px-3 pb-1"
    :class="
      disabled
        ? 'cursor-default bg-slate-50 text-stone-500/60'
        : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
    "
    :disabled="disabled"
  >
    <IconArrow
      class="w-3"
      :class="{
        'rotate-0': direction === 'right',
        'rotate-90': direction === 'down',
        'rotate-180': direction === 'left',
        '-rotate-90': direction === 'up',
      }"
    />
  </button>
</template>
<script setup>
defineProps(["disabled", "direction"])
</script>
