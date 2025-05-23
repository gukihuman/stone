<template>
  <div
    class="flex w-full items-center bg-circles bg-stone-500 overflow-hidden h-[170px] flex-shrink-0 -mt-2 z-10"
  >
    <!-- <div class="flex h-full p-3 bg-stone-700 justify-center flex-shrink-0">
      <Button750 @click="emit('append')"> append </Button750>
    </div> -->
    <div
      class="w-full h-full relative flex-grow overflow-hidden p-3 py-2"
      :class="{ 'bg-stone-700 z-20': isTextareaFocused }"
    >
      <div class="relative overflow-hidden rounded-xl scroll-screen h-full">
        <textarea
          ref="textareaEl"
          :value="textarea"
          @input="onInput"
          @focus="onFocus(emit)"
          @blur="onBlur(emit)"
          @scroll="onScroll"
          class="w-full h-full py-5 px-8 scroll-screen bg-lines resize-none text-xl bg-stone-400 text-stone-800 rounded-lg"
          :style="{ backgroundPositionY: linesOffset }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["modelValue"])
const emit = defineEmits([
  "update:modelValue",
  "append",
  "lock-hotkeys",
  "unlock-hotkeys",
])

const {
  isTextareaFocused,
  linesOffset,
  onFocus,
  onBlur,
  onScroll,
  focus,
  adjustScrollTop,
} = useFocused()

// els refs
const textareaEl = ref(null)

// reactive
const textarea = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => (textarea.value = newValue)
)

defineExpose({ focus: () => focus(textareaEl) })
////////////////////////////////////////////////////////////////////////////////
const dEmitUpdate = debounce((value) => emit("update:modelValue", value))

function onInput(event) {
  textarea.value = event.target.value
  dEmitUpdate(event.target.value)
  adjustScrollTop(textareaEl)
}
</script>
