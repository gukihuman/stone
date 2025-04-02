<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden flex-grow"
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
    <div class="w-full overflow-hidden flex-grow">
      <div class="overflow-hidden h-full">
        <div
          ref="textareaEl"
          class="w-full px-3 py-2 h-full flex flex-col gap-4 overflow-y-scroll items-center"
        >
          <!-- <FocusedRecord
            v-for="([eventName, eventDate, eventMemory], i) in eventData"
            :key="`event-memory-${i}`"
            :name="eventName"
            :date="eventDate"
            :text="eventMemory"
          /> -->
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
const props = defineProps(["topic", "events", "focusedEntity"])
const emit = defineEmits([
  "update-topic",
  "remove-topic",
  "lock-hotkeys",
  "unlock-hotkeys",
])

const { focusName } = useFocused()

// els refs
const nameEl = ref(null)
const textareaEl = ref(null)

// v-model
const name = ref(props.topic)

// const eventData = computed(() => {
//   return props.events.reduce((acc, event) => {
//     try {
//       const entityMemoryString = event.memory[props.focusedEntity]
//       if (entityMemoryString) {
//         const entityMemoryParsed = JSON.parse(entityMemoryString)
//         const topicMemoryData = entityMemoryParsed[props.topic]
//         const memoryText = topicMemoryData[props.level]
//         if (memoryText) acc.push([event.name, event.date, memoryText])
//       }
//     } catch (e) {}
//     return acc
//   }, [])
// })

defineExpose({ textareaEl, focusName: () => focusName(nameEl) })

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateTopic = debounce(() => emit("update-topic", name.value))
</script>
