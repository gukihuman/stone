<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden"
    >
      <input
        ref="nameEl"
        type="text"
        v-model="name"
        @input="dEmitUpdateEvent('name', name)"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
      <p
        class="focus:bg-stone-800 focus:text-stone-300 flex-grow px-7 pb-1 bg-stone-700 text-center pt-[2px] text-stone-400 truncate cursor-default"
      >
        {{ event.date.substring(0, 10) }}
      </p>
    </div>
    <!-- # mid ---------------------------------------------------------------->
    <div
      class="w-full relative h-full p-3"
      :class="[isTextareaFocused ? 'bg-stone-700' : '']"
    >
      <div class="relative overflow-hidden rounded-xl h-full">
        <textarea
          ref="textareaEl"
          :key="`textarea-${field}`"
          v-model="textarea"
          @input="onTextareaInput"
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
          :disabled="!field"
        />
      </div>
    </div>
    <!-- # bot ---------------------------------------------------------------->
    <div class="flex flex-col w-full bg-stone-700">
      <div class="flex p-3 gap-8 border-b-[3px] border-dashed border-stone-600">
        <PrettyNum :number="getTokens(getPrompt('text'))" theme="dark" />
        <div class="flex w-full justify-between">
          <CopyGen
            v-for="field in ['text', 'name', 'memory']"
            :key="`field-${field}`"
            :field="field"
            :is-locked="isLocked"
            @copy="(field) => emit('copy', field)"
            @gen="(field) => emit('gen', field)"
          />
        </div>
      </div>
      <div class="flex p-3 justify-between">
        <div class="flex">
          <Switch
            v-model="field"
            :states="fields"
            @change="emit('update-app-state', 'focusedField', field)"
          />
        </div>
        <ButtonLight
          @click="emit('update-app-state', 'focusedField', null)"
          :disabled="!field"
        >
          pretty memory
        </ButtonLight>
        <ButtonLight @click="emit('remove-event')">remove</ButtonLight>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["event", "field", "fields", "isLocked", "getPrompt"])
const emit = defineEmits([
  "update-event",
  "remove-event",
  "update-app-state",
  "copy",
  "gen",
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
  focusBot,
  focusTop,
} = useFocused()

// els refs
const nameEl = ref(null)
const textareaEl = ref(null)

// v-model
const name = ref(props.event?.name || "")
const field = ref(props.field) // to switch
const textarea = ref(props.field ? props.event[props.field] : getPrettyMemory())

watch(
  () => props.field,
  (newValue) => (field.value = newValue)
)
defineExpose({
  textareaEl,
  focusName: () => focusName(nameEl),
  focusBot: () => focusBot(textareaEl),
  focusTop: () => focusTop(textareaEl),
})
////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateEvent = debounce((key, v) => emit("update-event", [key, v]))

function onTextareaInput(event) {
  dEmitUpdateEvent(field.value, event.target.value)
  adjustScrollTop(textareaEl)
}
function getPrettyMemory() {
  const topicsParts = []
  try {
    const memory = JSON.parse(props.event.memory)
    Object.entries(memory).forEach(([topic, memories]) => {
      const part = []
      part.push(`# ${topic}`)
      part.push(memories[0])
      part.push(memories[1])
      topicsParts.push(part.join("\n\n"))
    })
  } catch (e) {}
  return topicsParts.join("\n\n\n\n")
}
</script>
