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
        @input="dEmitUpdateTopic"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
    </div>
    <!-- # mid --------------------------------------------------------------->
    <div class="w-full p-3 overflow-hidden flex-grow">
      <div class="overflow-hidden h-full rounded-lg">
        <div
          class="w-full h-full flex flex-col gap-4 scroll-light overflow-auto items-center rounded-lg bg-stone-450"
        >
          <FocusedRecord
            v-for="([eventName, eventDate, eventMemory], i) in eventData"
            :key="`event-memory-${i}`"
            :name="eventName"
            :date="eventDate"
            :text="eventMemory"
          />
        </div>
      </div>
    </div>
    <!-- # bot ---------------------------------------------------------------->
    <div class="flex flex-col w-full bg-stone-700">
      <div class="flex p-3 justify-end">
        <ButtonLight @click="emit('remove-topic')"> remove</ButtonLight>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["topic", "events", "topics", "selected"])
const emit = defineEmits([
  "update-topic",
  "remove-topic",
  "lock-hotkeys",
  "unlock-hotkeys",
  "focus",
  "blur",
])

const { focusName } = useFocused()

// els refs
const nameEl = ref(null)

// v-model
const name = ref(props.topic)

const eventData = computed(() => {
  return props.events.reduce((acc, event) => {
    const topicIndex = props.topics.indexOf(props.topic)
    try {
      const fullEventMemory = JSON.parse(event.memory)
      const level = props.selected[topicIndex]
      const eventMemory = fullEventMemory[props.topic]?.[level]
      if (eventMemory) acc.push([event.name, event.date, eventMemory])
    } catch (e) {}
    return acc
  }, [])
})

defineExpose({ focusName: () => focusName(nameEl) })

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateTopic = debounce(() => emit("update-topic", name.value))
</script>
