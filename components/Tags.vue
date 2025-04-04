<template>
  <div class="flex flex-col flex-1 gap-3 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <div class="flex justify-end gap-2 pb-1 pr-4 bg-stone-700">
        <PrettyNum
          v-if="tagsWithCounts.length"
          :number="totalMemoryTokens"
          theme="dark"
          class="cursor-default w-14 pt-[2px]"
        />
      </div>
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col">
          <div
            class="flex max-w-full gap-1 pr-2"
            v-for="({ tag, count }, i) in tagsWithCounts"
            :key="`tag-${i}`"
          >
            <ButtonList
              :active="focusedIndex === i && focusedList === 'tags'"
              @click="emit('toggle-focus', i)"
            >
              <span class="truncate">{{ tag }}</span>
              <PrettyNum :number="count" theme="light" />
            </ButtonList>
          </div>
          <p
            v-if="!tagsWithCounts.length"
            class="text-stone-400 italic mt-4 text-center px-3"
          >
            No tags found for {{ focusedEntity }}.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps([
  "uniqueTags",
  "events",
  "focusedEntity",
  "focusedIndex",
  "focusedList",
])
const emit = defineEmits(["toggle-focus"])

const listEl = ref(null)

const getTagTokenCount = (tag) => {
  let count = 0
  props.events.forEach((event) => {
    const memories = event.memory[props.focusedEntity]
    if (Array.isArray(memories)) {
      memories.forEach((memoryObj) => {
        if (Array.isArray(memoryObj.tags) && memoryObj.tags.includes(tag)) {
          count += memoryObj.tokens || 0
        }
      })
    }
  })
  return count
}

const tagsWithCounts = computed(() => {
  return props.uniqueTags
    .map((tag) => ({
      tag: tag,
      count: getTagTokenCount(tag),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag))
})

const totalMemoryTokens = computed(() => {
  let total = 0
  props.events.forEach((event) => {
    const memories = event.memory[props.focusedEntity]
    if (memories) {
      memories.forEach((memoryObj) => (total += memoryObj.tokens || 0))
    }
  })
  return total
})
</script>
