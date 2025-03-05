<template>
  <div class="w-[250px] flex flex-col gap-3">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- topics top menu -->
      <div class="flex">
        <button
          @click="sortTopicDown"
          class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
          :class="
            !editTopicId || topicsById[editTopicId].sort === 0
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <IconArrow class="w-3 rotate-90" />
        </button>
        <button
          @click="sortTopicUp"
          class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
          :class="
            !editTopicId ||
            topicsById[editTopicId].sort === topicsSorted.length - 1
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <IconArrow class="w-3 -rotate-90" />
        </button>
        <button
          @click="createTopic()"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
        <div
          class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
        >
          {{ totalTopicMemories || "" }}
        </div>
      </div>
      <!-- topic list -->
      <div ref="topicListRef" class="overflow-auto pb-2">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full"
            v-for="[id, { name, memoryIds, selected }] in topicsSorted"
            :key="id"
          >
            <button
              class="flex-grow overflow-hidden flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
              :class="
                editTopicId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
              "
              @click="emit('toggle-topic-edit', id)"
            >
              <span class="truncate">{{ name }}</span>
              {{ memoryIds.length || "" }}
            </button>
            <div
              class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
              @click="toggleTopicSelect(id)"
            >
              <div
                class="flex items-center justify-center rounded-full size-5 bg-stone-600"
              >
                <div
                  class="rounded-full size-3"
                  :class="[selected ? 'bg-stone-400' : 'bg-stone-600']"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import newId from "./utils/newId"
import swapSort from "./utils/swapSort"
import scrollToTop from "./utils/scrollToTop"

const props = defineProps([
  "topicsById",
  "editTopicId",
  "topicsSorted",
  "totalTopicMemories",
])

const emit = defineEmits(["toggle-topic-edit", "local-storage-save"])

const topicListRef = ref(null)

function createTopic() {
  const id = newId()
  props.topicsById[id] = {
    name: "topic",
    memoryIdsRaw: "", // valid JSON array of numbers as string itself
    memoryIds: [],
    selected: true,
    sort: Object.keys(props.topicsById).length,
  }
  emit("toggle-topic-edit", id)
  nextTick(() => scrollToTop(topicListRef.value))
}
function toggleTopicSelect(id) {
  props.topicsById[id].selected = !props.topicsById[id].selected
  emit("local-storage-save")
}
function sortTopicUp() {
  swapSort(props.topicsById, props.editTopicId, 1)
  emit("local-storage-save")
}
function sortTopicDown() {
  swapSort(props.topicsById, props.editTopicId, -1)
  emit("local-storage-save")
}
</script>
