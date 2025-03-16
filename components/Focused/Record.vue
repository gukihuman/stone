<template>
  <div class="w-full">
    <!-- top ------------------------------------------------------------------>
    <div
      class="flex justify-between h-9 bg-stone-550 cursor-default rounded-t-lg px-8 items-center"
    >
      <p class="text-stone-300 text-lg pb-[2px]">{{ name }}</p>
      <p v-if="date" class="text-stone-400">{{ date.substring(0, 10) }}</p>
    </div>
    <!-- text ----------------------------------------------------------------->
    <div
      class="w-full min-h-[76px] flex-shrink-0 rounded-b-lg p-8 pt-5 scroll-light bg-lines text-xl bg-stone-400 text-stone-800 flex flex-col cursor-default"
      :style="{ backgroundPositionY: `${LINE_OFFSET}px` }"
    >
      {{ text }}
    </div>
  </div>
</template>
<script setup>
const LINE_OFFSET = -8

defineProps(["name", "date", "text"])
</script>
