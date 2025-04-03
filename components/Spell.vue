<template>
  <div
    class="flex w-full items-center bg-circles rounded-b-lg bg-stone-500 overflow-hidden flex-[15%] flex-shrink-0 h-full -mt-2"
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
        class="flex flex-col gap-2 items-center justify-between flex-shrink-0 h-full"
      >
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
        <div class="flex flex-col gap-2">
          <ButtonLight
            @click="emit('context', 'custom')"
            :disabled="isContextLocked.custom.value"
            class="w-full"
          >
            custom
          </ButtonLight>
          <ButtonLight
            @click="emit('context', 'full')"
            :disabled="isContextLocked.full.value"
            class="w-full"
          >
            full
          </ButtonLight>
          <ButtonLight
            @click="emit('context', 'mini')"
            :disabled="isContextLocked.mini.value"
            class="w-full"
          >
            mini
          </ButtonLight>
        </div>
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
  "isContextLocked",
])

const emit = defineEmits(["context", "cast", "lock-hotkeys", "unlock-hotkeys"])

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

defineExpose({ focus: () => focus(textareaEl) })
</script>
