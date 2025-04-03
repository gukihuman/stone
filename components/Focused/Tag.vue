<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden flex-grow"
  >
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden px-3"
    >
      <p
        class="h-full flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate cursor-default pt-[6px]"
      >
        Tag: {{ focusedTag }}
      </p>
    </div>
    <div class="w-full overflow-hidden flex-grow">
      <div class="overflow-hidden h-full">
        <div
          ref="recordsContainerEl"
          class="w-full px-3 py-2 h-full flex flex-col gap-4 overflow-y-scroll items-center"
        >
          <FocusedRecord
            v-for="record in memoriesForTag"
            :key="record.memoryId"
            :name="record.eventName"
            :date="record.eventDate"
            :text="record.memoryText"
          />
          <p
            v-if="!memoriesForTag.length"
            class="text-stone-400 italic mt-4 text-center px-3"
          >
            No memories found for this tag and entity.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import FocusedRecord from "~/components/Focused/Record.vue"

const props = defineProps(["focusedTag", "events", "focusedEntity"])

const recordsContainerEl = ref(null)

const memoriesForTag = computed(() => {
  const results = []
  props.events.forEach((event) => {
    const entityMemories = event.memory[props.focusedEntity]
    if (Array.isArray(entityMemories)) {
      entityMemories.forEach((memoryObj) => {
        if (
          Array.isArray(memoryObj.tags) &&
          memoryObj.tags.includes(props.focusedTag)
        ) {
          results.push({
            eventName: event.name,
            eventDate: event.date,
            memoryText: memoryObj.text,
            memoryId: memoryObj.id,
          })
        }
      })
    }
  })
  return results.sort(
    (a, b) => Date.parse(a.eventDate) - Date.parse(b.eventDate)
  )
})
</script>
