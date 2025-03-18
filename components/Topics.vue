<template>
  <div class="w-[290px] flex flex-col gap-3 flex-shrink-0">
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
          class="cursor-default w-14 h-full"
        />
        <!-- ## circles top menu ---------------------------------------------->
        <div v-if="selected.length" class="flex pl-2 pr-[10px]">
          <div
            v-for="level in [0, 1, null]"
            class="flex-shrink-0 px-[2px] flex items-center justify-center cursor-pointer"
            @click="emit('toggle-select-all', level)"
          >
            <div
              class="flex items-center justify-center rounded-full size-5 bg-stone-600"
            >
              <div
                class="rounded-full size-3"
                :class="{
                  'bg-stone-300':
                    level === 0 && selected.every((is) => is === 0),
                  'bg-stone-400':
                    level === 1 && selected.every((is) => is === 1),
                  'bg-stone-500':
                    level === null && selected.every((is) => is === null),
                }"
              />
            </div>
          </div>
        </div>
        <div v-else class="w-[82px]" />
      </div>
      <!-- # list ------------------------------------------------------------->
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full"
            v-for="(topic, i) in topics"
            :key="`topic${i}`"
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
            <!-- ## circles list ---------------------------------------------->
            <div class="flex pr-[2px]">
              <div
                v-for="level in [0, 1, null]"
                class="flex-shrink-0 px-[2px] flex items-center justify-center cursor-pointer"
                @click="emit('toggle-select', i, level)"
              >
                <div
                  class="flex items-center justify-center rounded-full size-5 bg-stone-550"
                >
                  <div
                    class="rounded-full size-3"
                    :class="{
                      'bg-stone-300': level === 0 && selected[i] === 0,
                      'bg-stone-400': level === 1 && selected[i] === 1,
                      'bg-stone-500': level === null && selected[i] === null,
                    }"
                  />
                </div>
              </div>
            </div>
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
