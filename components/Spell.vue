<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden flex-shrink-0"
  >
    <div
      class="w-full relative flex-grow overflow-hidden min-h-[100px]"
      :class="{ 'bg-stone-700': isTextareaFocused }"
    >
      <textarea
        ref="textareaEl"
        :value="textarea"
        @input="
          (event) => {
            textarea = event.target.value
            adjustScrollTop
          }
        "
        @focus="onFocus(emit)"
        @blur="onBlur(emit)"
        @scroll="onScroll"
        class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl bg-stone-600 bg-lines-light selection-light text-stone-300 font-fira-code"
        :style="{ backgroundPositionY: linesOffset }"
      />
    </div>
    <div
      class="flex w-full p-3 bg-stone-700 justify-center gap-2 flex-shrink-0"
    >
      <ButtonLight @click="onContext" :disabled="isContextLocked">
        context
      </ButtonLight>
      <ButtonLight
        @click="
          () => {
            emit('cast', textarea)
            textarea = ''
          }
        "
      >
        cast
      </ButtonLight>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "events",
  "topics",
  "shapes",
  "files",
  "appState",
  "focusedEntity",
])

const emit = defineEmits(["cast", "lock-hotkeys", "unlock-hotkeys"])

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
const textarea = ref("")
const isContextLocked = ref(false)

////////////////////////////////////////////////////////////////////////////////
async function onContext() {
  const getContext = props.shapes[props.focusedEntity]?.getContext
  if (!getContext) return
  const input = getContext(
    props.events,
    props.topics,
    props.shapes,
    props.files,
    props.appState
  )
  await clipboard({ input, locked: isContextLocked })
}

defineExpose({ focus: () => focus(textareaEl) })
</script>
