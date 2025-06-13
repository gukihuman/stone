<template>
  <div
    class="flex w-full items-center bg-circles rounded-b-lg bg-stone-500 overflow-hidden h-[130px] flex-shrink-0 border-dashed border-t-[3px] border-coffee-650"
  >
    <div class="flex w-full relative h-full overflow-hidden p-3 pt-2 gap-2">
      <textarea
        ref="textareaEl"
        :value="textarea"
        @input="
          (event) => {
            textarea = event.target.value
            adjustScroll
          }
        "
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        @scroll="onScroll"
        class="w-full h-full py-5 px-8 scroll-screen bg-lines resize-none text-lg bg-stone-600 bg-lines-light selection-light text-stone-300 font-fira-code rounded-lg"
        :style="{ backgroundPositionY: linesOffset }"
      />
      <div
        class="flex flex-col gap-2 items-center justify-between flex-shrink-0 h-full min-w-[80px]"
      >
        <Button
          @click="
            () => {
              emit('cast', textarea)
              textarea = ''
            }
          "
          class="w-full"
          lock-active
        >
          cast
        </Button>
        <div class="flex flex-col gap-2 w-full">
          <Button
            v-for="{ name, type } in contexts"
            :key="`context-${name}`"
            @click="emit('context', type)"
            :active="isContextLocked[type].value"
            class="w-full"
            lock-active
          >
            {{ name }}
          </Button>
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

const { linesOffset, onScroll, focus, adjustScroll } = usePaper()

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
