<template>
  <div class="w-[250px] flex flex-col gap-3">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- topics menu top -->
      <div class="flex">
        <ButtonArrow
          @click="sortTopicDown"
          :disabled="!editTopicId || topicsById[editTopicId].sort === 0"
          direction="down"
        />
        <ButtonArrow
          @click="sortTopicUp"
          :disabled="
            !editTopicId ||
            topicsById[editTopicId].sort === topicsSorted.length - 1
          "
          direction="up"
        />
        <button
          @click="createTopic()"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
      </div>
      <!-- topic list -->
      <div ref="topicListRef" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full"
            v-for="[id, { name, memoryIds, selected }] in topicsSorted"
            :key="id"
          >
            <ButtonList
              :active="editTopicId === id"
              @click="emit('toggle-topic-edit', id)"
            >
              <span class="truncate">{{ name }}</span>
              <Binary
                v-if="memoryIds.length"
                :groups="toBinaryGroups(memoryIds.length)"
                :theme="selected ? 'light' : 'dark'"
              />
            </ButtonList>
            <div
              class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
              @click="toggleTopicSelect(id)"
            >
              <div
                class="flex items-center justify-center rounded-full size-5 bg-stone-600"
              >
                <div
                  class="rounded-full size-3"
                  :class="{ 'bg-stone-300/80': selected }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- topics menu bot -->
      <div class="flex justify-end min-h-7 bg-stone-700 pr-2">
        <div class="pr-2 pt-[1px] cursor-default">
          <Binary
            v-if="totalTopicMemories"
            :groups="toBinaryGroups(totalTopicMemories)"
            theme="light"
          />
        </div>
        <div
          class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
          @click="toggleAll()"
        >
          <div
            class="flex items-center justify-center rounded-full size-5 bg-stone-600"
          >
            <div
              class="rounded-full size-3"
              :class="{ 'bg-stone-300/80': isAllSelected }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import newId from "~/utils/newId"
import swapSort from "~/utils/swapSort"
import scrollToTop from "~/utils/scrollToTop"

const props = defineProps([
  "topicsById",
  "editTopicId",
  "topicsSorted",
  "totalTopicMemories",
  "isAnyInputFocused",
  "memoryRecordsById",
])
const emit = defineEmits(["toggle-topic-edit", "local-storage-save"])

const topicListRef = ref(null)

const isAllSelected = computed(() => {
  if (!props.topicsSorted.length) return false
  let result = true
  props.topicsSorted.forEach(([, { selected }]) => {
    if (!selected) result = false
  })
  return result
})
function toggleAll() {
  let state = true
  if (isAllSelected.value) state = false
  props.topicsSorted.forEach(([, topic]) => (topic.selected = state))
}
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
