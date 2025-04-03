<template>
  <div
    class="flex flex-col items-center bg-circles bg-stone-500 overflow-hidden flex-[30%]"
    :class="field === 'text' ? 'rounded-t-lg' : 'rounded-lg'"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden px-3 gap-2"
    >
      <div class="flex gap-3">
        <div class="flex gap-1">
          <Switch
            v-model="field"
            :states="fields"
            @change="emit('update-app-state', 'focusedField', field)"
          />
          <ButtonLight
            @click="emit('update-app-state', 'focusedField', null)"
            :disabled="!field"
            theme="darker"
          >
            pretty
          </ButtonLight>
        </div>
      </div>
      <input
        ref="nameEl"
        type="text"
        v-model="name"
        @input="dEmitUpdateEvent('name', name)"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
      <p
        class="pb-1 text-center pt-[2px] text-stone-400 truncate cursor-default"
      >
        {{ event.date.substring(0, 10) }}
      </p>
      <ButtonLight @click="emit('remove-event')">remove</ButtonLight>
    </div>
    <!-- # mid ---------------------------------------------------------------->
    <div
      class="w-full relative h-full overflow-hidden"
      :class="{ 'bg-stone-700 z-20': isTextareaFocused, 'px-3 py-2': field }"
    >
      <div
        v-if="field"
        class="relative overflow-hidden rounded-xl scroll-light h-full"
      >
        <textarea
          ref="textareaEl"
          :key="`textarea-${field}`"
          :value="field === 'memory' ? memoryContent : textContent"
          @input="
            (e) => {
              if (field === 'memory') memoryContent = e.target.value
              else textContent = e.target.value
              onTextareaInput()
            }
          "
          @scroll="onScroll"
          @focus="onFocus(emit)"
          @blur="onBlur(emit)"
          class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl"
          :class="
            field !== 'memory'
              ? 'bg-stone-400 text-stone-800'
              : 'bg-stone-600 bg-lines-light selection-light text-stone-300'
          "
          :style="{ backgroundPositionY: linesOffset }"
        />
      </div>
      <div v-else class="relative overflow-auto h-full max-h-full">
        <div
          ref="textareaEl"
          class="w-full h-full px-3 py-2 flex flex-col gap-4 overflow-y-scroll auto items-center"
        >
          <FocusedRecord
            v-for="([topic, topicMemory], i) in topicParts"
            :key="`event-memory-${i}`"
            :name="topic"
            :text="topicMemory"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "event",
  "field",
  "fields",
  "isLocked",
  "focusedEntity",
])
const emit = defineEmits([
  "update-event",
  "remove-event",
  "update-app-state",
  "lock-hotkeys",
  "unlock-hotkeys",
])
const {
  isTextareaFocused,
  linesOffset,
  onFocus,
  onBlur,
  onScroll,
  adjustScrollTop,
  focusName,
  focus,
} = useFocused()

// els refs
const nameEl = ref(null)
const textareaEl = ref(null)

// v-model
const name = ref(props.event?.name || "")
const textContent = ref(props.event?.text || "")
const memoryContent = ref("")
const field = ref(props.field)

const focusedMemoryString = computed(() => {
  return props.event.memory[props.focusedEntity] || ""
})
const topicParts = computed(() => {
  const result = []
  if (!props.event?.memory) return result // No memory object

  try {
    const entityMemoryString = props.event.memory[props.focusedEntity] // Get string for focused entity
    if (entityMemoryString) {
      const entityMemoryParsed = JSON.parse(entityMemoryString) // Parse the stringified JSON array

      Object.entries(entityMemoryParsed).forEach(([topicName, memories]) => {
        if (topicName && memories && memories.length === 2) {
          const displayText = [memories[0], `<br><br>`, memories[1]].join(
            "\n\n"
          )
          result.push([topicName, displayText])
        }
      })
    }
  } catch (e) {}
  return result
})

watch(focusedMemoryString, (newString) => {
  if (newString !== memoryContent.value) memoryContent.value = newString
})

watch(name, (newName) => {
  dEmitUpdateEvent("name", newName)
})
watch(textContent, (newText) => {
  if (props.field === "text") dEmitUpdateEvent("text", newText)
  dUpdateTokens(newText)
})
watch(memoryContent, (newMemString) => {
  if (props.field === "memory" && props.event?.memory) {
    props.event.memory[props.focusedEntity] = newMemString
    dEmitUpdateEvent("memory", { ...props.event.memory })
  }
})
watch(
  () => props.event,
  (newEvent) => {
    if (!newEvent) return
    name.value = newEvent.name
    textContent.value = newEvent.text
    const newMemString = newEvent.memory?.[props.focusedEntity] || ""
    if (newMemString !== memoryContent.value) {
      memoryContent.value = newMemString
    }
  },
  { immediate: true, deep: true }
)
defineExpose({
  textareaEl,
  focusName: () => focusName(nameEl),
  focus: () => focus(textareaEl),
})
////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateEvent = debounce((key, v) => emit("update-event", [key, v]))
const dUpdateTokens = debounce((v) => (props.event.tokens = getTokens(v)))

function onTextareaInput(event) {
  adjustScrollTop(textareaEl)
}
</script>
