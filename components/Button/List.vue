<template>
  <button
    class="flex w-full py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between overflow-hidden"
    :class="
      active
        ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
        : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
    "
  >
    <slot />
  </button>
</template>
<script setup>
defineProps(["active"])
</script>
