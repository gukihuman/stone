<template>
  <div
    class="flex w-full items-center bg-circles rounded-b-lg bg-stone-500 overflow-hidden flex-[10%] flex-shrink-0 h-full -mt-2"
  >
    <div
      class="flex w-full relative h-full overflow-hidden p-3 pt-2 gap-2"
      :class="{ 'bg-stone-700 z-30': isTextareaFocused }"
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
        class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl bg-stone-600 bg-lines-light selection-light text-stone-300 font-fira-code rounded-lg"
        :style="{ backgroundPositionY: linesOffset }"
      />
      <div
        class="flex flex-col gap-2 items-center justify-end flex-shrink-0 h-full"
      >
        <ButtonLight
          @click="onContext"
          :disabled="isContextLocked"
          class="w-full"
        >
          context
        </ButtonLight>
        <ButtonLight
          @click="
            () => {
              emit('cast', textarea)
              textarea = ''
            }
          "
          class="w-full"
        >
          cast
        </ButtonLight>
      </div>
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
