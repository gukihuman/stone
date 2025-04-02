<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden h-[200px] flex-shrink-0"
  >
    <div
      class="w-full relative flex-grow overflow-hidden"
      :class="{ 'bg-stone-700': isTextareaFocused }"
    >
      <textarea
        ref="textareaEl"
        :value="textarea"
        @input="onInput"
        @focus="onFocus(emit)"
        @blur="onBlur(emit)"
        @scroll="onScroll"
        class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl bg-stone-400 text-stone-800"
        :style="{ backgroundPositionY: linesOffset }"
      />
    </div>
    <div class="flex w-full p-3 bg-stone-700 justify-center flex-shrink-0">
      <ButtonLight @click="emit('append')"> append </ButtonLight>
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
