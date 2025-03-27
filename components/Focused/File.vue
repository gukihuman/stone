<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden flex-grow"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden px-3 gap-2"
    >
      <div
        class="h-full focus:bg-stone-800 flex-grow px-7 bg-stone-700 text-center text-xl text-stone-300 truncate cursor-default pt-[6px]"
      >
        {{ file.path }}
      </div>
    </div>
    <div class="w-full relative flex-grow overflow-hidden">
      <div class="relative overflow-hidden rounded-b-xl scroll-light h-full">
        <textarea
          ref="textareaEl"
          v-model="textarea"
          @scroll="onScroll"
          class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl bg-stone-400 text-stone-800"
          :style="{ backgroundPositionY: linesOffset }"
          disabled
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const { linesOffset, onScroll } = useFocused()
const props = defineProps(["file"])

// els refs
const textareaEl = ref(null)

// v-model
const textarea = ref(props.file.content)

defineExpose({ textareaEl })
</script>
