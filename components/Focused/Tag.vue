<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden flex-grow"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden"
    >
      <input
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
        :value="tag.name"
        disabled
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
  </div>
</template>

<script setup>
const props = defineProps(["tag", "events", "focusedEntity"])

// const eventData = computed(() => {
//   return props.events.reduce((acc, event) => {
//     try {
//       const entityMemoryString = event.memory[props.focusedEntity]
//       if (entityMemoryString) {
//         const entityMemoryParsed = JSON.parse(entityMemoryString)
//         const topicMemoryData = entityMemoryParsed[props.tag]
//         const memoryText = topicMemoryData[props.level]
//         if (memoryText) acc.push([event.name, event.date, memoryText])
//       }
//     } catch (e) {}
//     return acc
//   }, [])
// })
</script>
