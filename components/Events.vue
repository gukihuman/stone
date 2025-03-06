<template>
  <div
    class="w-[250px] overflow-hidden flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg"
  >
    <!-- events menu top -->
    <div class="flex">
      <ButtonArrow
        @click="sortEventDown"
        :disabled="!editEventId || eventsById[editEventId].sort === 0"
        direction="down"
      />
      <ButtonArrow
        @click="sortEventUp"
        :disabled="
          !editEventId ||
          eventsById[editEventId].sort === eventsSorted.length - 1
        "
        direction="up"
      />
      <button
        @click="createEvent()"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
    </div>
    <!-- event list -->
    <div ref="eventListRef" class="overflow-y-scroll pb-2 flex-grow">
      <div class="flex flex-col-reverse">
        <div v-for="[id, { name, memoryIds, sort }] in eventsSorted" :key="id">
          <ButtonList
            :active="editEventId === id"
            @click="emit('toggle-event-edit', id)"
          >
            <span class="truncate">{{ name }}</span>
            <Binary
              v-if="memoryIds.length"
              :groups="toBinaryGroups(memoryIds.length)"
              :theme="
                editEventId &&
                sort >= eventsById[editEventId].sort - recentEventLimit &&
                sort < eventsById[editEventId].sort
                  ? 'light'
                  : 'dark'
              "
            />
          </ButtonList>
          <div
            v-if="
              editEventId &&
              sort ===
                Math.max(eventsById[editEventId].sort - recentEventLimit, 0)
            "
            class="-mb-[2px] h-[2px] w-full bg-gradient-to-r from-stone-400 to-transparent"
          />
        </div>
      </div>
    </div>
    <!-- events menu bot -->
    <div class="flex justify-between min-h-7 bg-stone-700 pr-2">
      <div>
        <ButtonArrow
          @click="emit('recent-limit-more')"
          :disabled="!editEventId"
          direction="down"
        />
        <ButtonArrow
          @click="emit('recent-limit-less')"
          :disabled="!editEventId || recentEventLimit <= 0"
          direction="up"
        />
      </div>
      <div class="pr-2 pt-[1px] cursor-default">
        <Binary
          v-if="totalRecentMemories"
          :groups="toBinaryGroups(totalRecentMemories)"
          theme="light"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps([
  "eventsById",
  "eventsSorted",
  "editEventId",
  "totalRecentMemories",
  "recentEventLimit",
])
const emit = defineEmits([
  "toggle-event-edit",
  "local-storage-save",
  "recent-limit-more",
  "recent-limit-less",
])
const eventListRef = ref(null)

function createEvent() {
  const id = newId()
  props.eventsById[id] = {
    name: "current",
    date: new Date().toLocaleDateString(),
    text: "",
    memoryStringsRaw: "", // valid JSON array of strings as string itself
    memoryIds: [],
    sort: Object.keys(props.eventsById).length,
  }
  emit("toggle-event-edit", id)
  nextTick(() => scrollToTop(eventListRef.value))
}
function sortEventUp() {
  swapSort(props.eventsById, props.editEventId, 1)
  emit("local-storage-save")
}
function sortEventDown() {
  swapSort(props.eventsById, props.editEventId, -1)
  emit("local-storage-save")
}
</script>
