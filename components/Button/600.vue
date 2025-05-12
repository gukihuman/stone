<template>
  <button
    class="px-3 pb-1 rounded-lg min-w-[80px] h-7 font-semibold"
    :class="{
      'bg-stone-600 text-stone-300 hover:bg-stone-650 hover:text-stone-200':
        !disabled && !active,
      'cursor-default': disabled || active,
      'bg-stone-550 text-stone-400': disabled,
      'bg-amber-400 text-amber-900': active,
    }"
    :disabled="disabled || active"
  >
    <slot />
  </button>
</template>
<script setup>
const props = defineProps(["disabled", "active"])
</script>
