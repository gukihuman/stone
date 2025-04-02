<template>
  <div class="flex flex-col flex-1 gap-3 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top menu --------------------------------------------------------->
      <div class="flex bg-stone-700 pr-4">
        <ButtonArrow
          @click="emit('sort-down')"
          :disabled="focusedIndex === null || focusedIndex === 0"
          direction="down"
        />
        <ButtonArrow
          @click="emit('sort-up')"
          :disabled="
            focusedIndex === null || focusedIndex === topics.length - 1
          "
          direction="up"
        />
        <button
          @click="emit('new-topic')"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
        <!-- <PrettyNum
          :number="getTokensTotal()"
          theme="dark"
          class="cursor-default w-14 pt-[2px]"
        /> -->
      </div>
      <!-- # list ------------------------------------------------------------->
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full gap-1"
            v-for="(topic, i) in topics"
            :key="`topic-${i}`"
          >
            <ButtonList
              :active="focusedIndex === i"
              @click="emit('toggle-focus', i)"
            >
              <span class="truncate">{{ topic }}</span>
              <!-- <PrettyNum
                :number="getTokens(getMemories(topic))"
                theme="light"
              /> -->
            </ButtonList>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["topics", "events", "focusedIndex", "focusedEntity"])
const emit = defineEmits([
  "new-topic",
  "toggle-focus",
  "toggle-select",
  "toggle-select-all",
  "sort-up",
  "sort-down",
])

// els refs
const listEl = ref(null)

////////////////////////////////////////////////////////////////////////////////
// function getMemories(topicName) {
//   const topicIndex = props.topics.indexOf(topicName) // Find index within the entity-specific list
//   if (topicIndex === -1) return "" // Topic not found for this entity

//   const level = props.selected[topicIndex] // Get selection level using entity-specific selection array
//   if (level === null) return "" // Topic not selected

//   return props.events.reduce((acc, event) => {
//     try {
//       const entityMemoryString = event.memory?.[props.focusedEntity]
//       if (entityMemoryString) {
//         const entityMemoryParsed = JSON.parse(entityMemoryString) // Parse it
//         // Find memory for the specific topic
//         const topicMemoryData = entityMemoryParsed[topicName]
//         const memoryText = topicMemoryData?.[level] // Get text for selected level

//         if (memoryText) {
//           // Construct the string to contribute to token count (or display later)
//           const eventLine = [event.name, event.date.substring(0, 10)].join(" ")
//           // Accumulate text for token counting. Joining with \n\n approximates context.
//           acc = [acc, eventLine, memoryText].join("\n\n")
//         }
//       }
//     } catch (e) {}
//     return acc
//   }, "")
// }
// function getTokensTotal() {
//   return props.topics.reduce((acc, topic) => {
//     acc += getTokens(getMemories(topic))
//     return acc
//   }, 0)
// }
</script>
