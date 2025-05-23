<template>
  <div
    class="flex w-full items-center bg-circles rounded-b-lg bg-stone-500 overflow-hidden h-[130px] flex-shrink-0 border-dashed border-t-[3px] border-coffee-650"
  >
    <div
      class="flex w-full relative h-full overflow-hidden p-3 pt-2 gap-2"
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
        class="w-full h-full py-5 px-8 scroll-screen bg-lines resize-none text-lg bg-stone-600 bg-lines-light selection-light text-stone-300 font-fira-code rounded-lg"
        :style="{ backgroundPositionY: linesOffset }"
      />
      <div
        class="flex flex-col gap-2 items-center justify-between flex-shrink-0 h-full min-w-[80px]"
      >
        <Button750
          @click="
            () => {
              emit('cast', textarea)
              textarea = ''
            }
          "
          class="w-full"
        >
          cast
        </Button750>
        <div class="flex flex-col gap-2 w-full">
          <Button750
            v-for="{ name, type } in contexts"
            :key="`context-${name}`"
            @click="emit('context', type)"
            :active="isContextLocked[type].value"
            class="w-full"
          >
            {{ name }}
          </Button750>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "events",
  "shapes",
  "files",
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

const contexts = computed(() => [
  { name: props.focusedEntity, type: "entity" },
  { name: "full", type: "full" },
])

defineExpose({ focus: () => focus(textareaEl) })
</script>
