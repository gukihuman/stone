<template>
  <div
    class="flex flex-col items-center bg-circles bg-stone-500 overflow-hidden flex-[30%]"
    :class="field === 'text' ? 'rounded-t-lg' : 'rounded-lg'"
  >
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
          <Button800
            @click="emit('update-app-state', 'focusedField', null)"
            :disabled="!field"
            theme="darker"
          >
            pretty
          </Button800>
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
      <Button800 @click="emit('remove-event')">remove</Button800>
    </div>

    <div
      class="w-full relative h-full overflow-hidden"
      :class="{ 'px-3 py-2': field }"
    >
      <div
        v-if="field === 'text' || field === 'memory'"
        class="relative overflow-hidden rounded-xl scroll-screen h-full"
      >
        <textarea
          ref="textareaEl"
          :key="`textarea-${field}-${focusedEntity}-${event.id}`"
          :value="field === 'memory' ? memoryContent : textContent"
          @input="handleTextareaInput"
          @scroll="onScroll"
          @focus="emit('lock-hotkeys')"
          @blur="emit('unlock-hotkeys')"
          class="w-full h-full py-5 px-8 scroll-screen bg-lines resize-none"
          :class="
            field === 'text'
              ? 'bg-stone-400 text-stone-800 text-xl'
              : 'bg-stone-600 bg-lines-light selection-light text-stone-300 font-mono text-lg'
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
            v-for="(memoryObj, i) in entityMemoriesForPrettyView"
            :key="memoryObj.id || `memory-${i}`"
            :title="memoryObj.tags"
            :text="memoryObj.text || ''"
            theme="tags"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["event", "field", "fields", "focusedEntity"])
const emit = defineEmits([
  "update-event",
  "remove-event",
  "update-app-state",
  "lock-hotkeys",
  "unlock-hotkeys",
])
const { linesOffset, onScroll, adjustScroll, focus } = usePaper()

const nameEl = ref(null)
const textareaEl = ref(null)

const name = ref(props.event?.name || "")
const textContent = ref(props.event?.text || "")
const memoryContent = ref("")
const field = ref(props.field)

const entityMemoriesForPrettyView = computed(() => {
  const memories = props.event.memory[props.focusedEntity]
  return Array.isArray(memories) ? memories : []
})

const updateMemoryContentFromEvent = () => {
  const currentMemoryArray = props.event.memory[props.focusedEntity]
  if (Array.isArray(currentMemoryArray)) {
    memoryContent.value = JSON.stringify(currentMemoryArray, null, 2)
  } else {
    memoryContent.value = "[]"
  }
}

watch(
  () => [props.event, props.focusedEntity],
  () => {
    name.value = props.event.name
    textContent.value = props.event.text
    updateMemoryContentFromEvent()
  },
  { immediate: true, deep: true }
)

watch(field, (newField) => {
  if (newField === null) {
    updateMemoryContentFromEvent()
  }
})

watch(name, (newName) => {
  dEmitUpdateEvent("name", newName)
})

watch(textContent, (newText) => {
  if (props.field !== "text") return
  dEmitUpdateEvent("text", newText)
  dUpdateTokens(newText)
})

watch(memoryContent, (newMemString) => {
  if (props.field !== "memory") return
  try {
    const parsedMemoryArray = JSON.parse(newMemString)
    if (Array.isArray(parsedMemoryArray)) {
      const fullMemoryObject = { ...props.event.memory }
      fullMemoryObject[props.focusedEntity] = parsedMemoryArray
      dEmitUpdateEvent("memory", toRaw(fullMemoryObject))
    } else {
      console.warn("Parsed memory content is not an array.")
    }
  } catch (e) {
    console.error("Error parsing memory JSON string:", e)
  }
})

const handleTextareaInput = (e) => {
  const value = e.target.value
  if (props.field === "memory") {
    memoryContent.value = value
  } else if (props.field === "text") {
    textContent.value = value
  }
  adjustScroll(textareaEl)
}

const dEmitUpdateEvent = debounce((key, v) => {
  emit("update-event", [key, v])
}, 300)

const dUpdateTokens = debounce((v) => {
  if (props.event) {
    props.event.tokens = getTokens(v)
  }
}, 500)

defineExpose({
  textareaEl,
  focus: () => focus(textareaEl),
})
</script>
