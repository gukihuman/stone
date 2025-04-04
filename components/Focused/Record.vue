<template>
  <div class="w-full">
    <!-- text ----------------------------------------------------------------->
    <div
      class="w-full min-h-[76px] flex-shrink-0 rounded-t-lg p-8 pt-5 scroll-light bg-lines text-xl bg-stone-400 text-stone-800 flex flex-col cursor-default"
      :style="{ backgroundPositionY: `${LINE_OFFSET}px` }"
      v-html="text"
    />
    <!-- bot ------------------------------------------------------------------>
    <div
      class="flex justify-between bg-stone-550 cursor-default rounded-b-lg items-center w-full"
      :class="title.length > 1 ? 'px-3' : 'px-8'"
    >
      <div class="flex gap-2 flex-wrap py-2">
        <p
          v-for="item in title"
          class="pb-1 rounded-lg"
          :class="
            title.length > 1
              ? 'bg-stone-650 px-3 text-stone-350'
              : 'text-stone-300 text-lg'
          "
        >
          {{ item }}
        </p>
      </div>
      <p v-if="date" class="text-stone-400">{{ date.substring(0, 10) }}</p>
    </div>
  </div>
</template>
<script setup>
const LINE_OFFSET = -8

const props = defineProps(["title", "date", "text"])
</script>
