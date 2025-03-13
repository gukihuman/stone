<template>
  <div class="w-[250px] flex flex-col gap-3 flex-shrink-0">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top menu --------------------------------------------------------->
      <div class="flex">
        <ButtonArrow
          @click="emit('sort-topic-down')"
          :disabled="focusedIndex === null || focusedIndex === 0"
          direction="down"
        />
        <ButtonArrow
          @click="emit('sort-topic-up')"
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
      </div>
      <!-- # list ------------------------------------------------------------->
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full"
            v-for="(topic, index) in topics"
            :key="`topic${index}`"
          >
            <ButtonList
              :active="focusedIndex === index"
              @click="emit('toggle-topic-focus', index)"
            >
              <span class="truncate">{{ topic }}</span>
            </ButtonList>
            <!-- <div
              class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
              @click=""
            >
              <div
                class="flex items-center justify-center rounded-full size-5 bg-stone-600"
              >
                <div
                  class="rounded-full size-3"
                  :class="{ 'bg-stone-300/80': selected }"
                />
              </div>
            </div> -->
          </div>
        </div>
      </div>
      <!-- # bot menu --------------------------------------------------------->
      <div class="flex justify-end min-h-7 bg-stone-700 pr-2">
        <div
          class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
        >
          <!-- @click="toggleAll()" -->
          <div
            class="flex items-center justify-center rounded-full size-5 bg-stone-600"
          >
            <!-- <div
              class="rounded-full size-3"
              :class="{ 'bg-stone-300/80': isAllSelected }"
            /> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["topics", "focusedIndex"])
const emit = defineEmits([
  "new-topic",
  "toggle-topic-focus",
  "sort-topic-up",
  "sort-topic-down",
])

// els refs
const listEl = ref(null)

////////////////////////////////////////////////////////////////////////////////
// const isAllSelected = computed(() => {
//   if (!props.topicsSorted.length) return false
//   let result = true
//   props.topicsSorted.forEach(([, { selected }]) => {
//     if (!selected) result = false
//   })
//   return result
// })
// function toggleAll() {
//   let state = true
//   if (isAllSelected.value) state = false
//   props.topicsSorted.forEach(([, topic]) => (topic.selected = state))
// }
// function toggleTopicSelect(id) {
//   props.topicsById[id].selected = !props.topicsById[id].selected
//   emit("local-storage-save")
// }
</script>
