<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden px-3 gap-2"
    >
      <CopyGen
        field="name"
        :is-locked="isLocked"
        @copy="(field) => emit('copy', field)"
        @gen="(field) => emit('gen', field)"
      />
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
      class="w-full relative flex-grow overflow-hidden"
      :class="{ 'bg-stone-700': isTextareaFocused, 'p-3': field }"
    >
      <div
        v-if="field"
        class="relative overflow-hidden rounded-xl scroll-light h-full"
      >
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
        />
      </div>
      <div v-else class="relative overflow-auto h-full max-h-full">
        <div
          ref="textareaEl"
          class="w-full h-full p-3 flex flex-col gap-4 overflow-y-scroll auto items-center"
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
    <!-- # bot ---------------------------------------------------------------->
    <div class="flex flex-col w-full bg-stone-700 flex-shrink-0">
      <div class="flex p-3 justify-between gap-5">
        <div class="flex gap-3 flex-grow justify-between">
          <CopyGen
            field="text"
            :is-locked="isLocked"
            @copy="(field) => emit('copy', field)"
            @gen="(field) => emit('gen', field)"
          />
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
          <CopyGen
            field="memory"
            :is-locked="isLocked"
            @copy="(field) => emit('copy', field)"
            @gen="(field) => emit('gen', field)"
          />
          <PrettyNum
            :number="getTokens(getPrompt('text'))"
            theme="dark"
            class="cursor-default pt-[1px] w-[60px] justify-end"
          />
        </div>
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
const textarea = ref(props.event[props.field])

const topicParts = computed(() => {
  const result = []
  try {
    const memory = JSON.parse(props.event.memory)
    Object.entries(memory).forEach(([topic, memories]) => {
      result.push([topic, [memories[0], `<br><br>`, memories[1]].join("\n\n")])
    })
  } catch (e) {}
  return result
})
watch(
  () => props.field,
  (newValue) => (field.value = newValue)
)
watch(
  props.event, // for gen
  (newValue) => {
    name.value = newValue.name
    textarea.value = newValue[props.field]
  }
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
</script>
