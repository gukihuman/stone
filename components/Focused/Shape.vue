<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-t-lg bg-stone-500 overflow-hidden flex-grow"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden px-3 gap-3"
    >
      <p
        class="h-full flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate cursor-default pt-[6px]"
      >
        {{ shapeName }}
      </p>
    </div>
    <!-- # mid ---------------------------------------------------------------->
    <div class="w-full relative flex-grow overflow-hidden px-3 py-2">
      <div class="relative overflow-hidden rounded-b-lg scroll-screen h-full">
        <textarea
          ref="textareaEl"
          :value="textarea"
          @input="
            (event) => {
              textarea = event.target.value
              dEmitUpdateShape(shapeName, textarea)
              adjustScroll(textareaEl)
            }
          "
          @focus="emit('lock-hotkeys')"
          @blur="emit('unlock-hotkeys')"
          @scroll="onScroll"
          class="w-full h-full py-5 px-8 scroll-screen bg-lines resize-none text-xl bg-stone-600 bg-lines-light selection-light text-stone-300 font-fira-code rounded-lg"
          :style="{ backgroundPositionY: linesOffset }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["shapeName", "shapeDefinition"])
const emit = defineEmits(["update-shape", "lock-hotkeys", "unlock-hotkeys"])
const { linesOffset, onScroll, focus, adjustScroll } = usePaper()

// els refs
const textarea = ref(props.shapeDefinition)
const textareaEl = ref(null)

defineExpose({ focus: () => focus(textareaEl) })

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateShape = debounce((name, textarea) => {
  emit("update-shape", name, textarea)
})
</script>
