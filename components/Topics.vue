<template>
  <div class="flex flex-col flex-1 gap-3 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top menu --------------------------------------------------------->
      <div class="flex bg-stone-700">
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
        <PrettyNum
          :number="getTokensTotal()"
          theme="dark"
          class="cursor-default w-14 pt-[2px]"
        />
        <div v-if="selected.length" class="flex pl-2 pr-2">
          <Circles
            :selected="selected"
            :states="[0, 1, null]"
            @toggle="(state) => emit('toggle-select-all', state)"
          />
        </div>
        <div v-else class="w-[82px]" />
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
              <PrettyNum
                :number="getTokens(getMemories(topic))"
                theme="light"
              />
            </ButtonList>
            <Circles
              :selected="selected"
              :index="i"
              :states="[0, 1, null]"
              @toggle="(state) => emit('toggle-select', i, state)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["topics", "events", "selected", "focusedIndex"])
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
function getMemories(topic) {
  return props.events.reduce((acc, event) => {
    const topicIndex = props.topics.indexOf(topic)
    try {
      const memory = JSON.parse(event.memory)
      const level = props.selected[topicIndex]
      const topicMemory = memory[topic]?.[level]
      const eventLine = [event.name, event.date.substring(0, 10)].join(" ")
      if (topicMemory) acc = [acc, eventLine, topicMemory].join("\n\n")
    } catch (e) {}
    return acc
  }, "")
}
function getTokensTotal() {
  return props.topics.reduce((acc, topic) => {
    acc += getTokens(getMemories(topic))
    return acc
  }, 0)
}
</script>
