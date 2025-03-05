<template>
  <div
    class="w-[250px] overflow-hidden flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg"
  >
    <!-- events top menu -->
    <div class="flex">
      <button
        @click="sortEventDown"
        class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
        :class="
          !editEventId || eventsById[editEventId].sort === 0
            ? 'cursor-default bg-slate-50 text-stone-500/60'
            : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
        "
      >
        <IconArrow class="w-3 rotate-90" />
      </button>
      <button
        @click="sortEventUp"
        class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
        :class="
          !editEventId ||
          eventsById[editEventId].sort === eventsSorted.length - 1
            ? 'cursor-default bg-slate-50 text-stone-500/60'
            : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
        "
      >
        <IconArrow class="w-3 -rotate-90" />
      </button>
      <button
        @click="createEvent()"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div
        class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
      >
        {{ totalRecentMemories || "" }}
      </div>
    </div>
    <!-- event list -->
    <div ref="eventListRef" class="overflow-auto pb-2">
      <div class="flex flex-col-reverse">
        <div v-for="[id, { name, memoryIds, sort }] in eventsSorted" :key="id">
          <ButtonList
            :active="editEventId === id"
            @click="emit('toggle-event-edit', id)"
          >
            <span class="truncate">{{ name }}</span>
            <div class="flex gap-4">
              <div class="flex gap-2 justify-end">
                <div
                  v-for="(tokenString, index) in eventTokensById[id]"
                  :key="`memory-tokens-${id}`"
                  class="h-5 text-xl flex items-center justify-end tracking-[-0.25rem]"
                  :class="
                    index === eventTokensById[id].length - 1
                      ? 'text-stone-400'
                      : 'text-stone-300'
                  "
                >
                  {{ tokenString }}
                </div>
              </div>
              <div class="flex gap-2 justify-end w-16" v-if="memoryIds.length">
                <div
                  v-for="(tokenString, index) in formatNumber(memoryIds.length)"
                  :key="`memory-length-${id}`"
                  class="h-5 text-2xl flex items-center justify-end tracking-[-0.25rem]"
                  :class="
                    index === formatNumber(memoryIds.length).length - 1
                      ? 'text-stone-400'
                      : 'text-stone-300'
                  "
                >
                  {{ tokenString }}
                </div>
              </div>
            </div>
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
  </div>
</template>
<script setup>
const props = defineProps([
  "eventsById",
  "eventTokensById",
  "eventsSorted",
  "editEventId",
  "totalRecentMemories",
  "recentEventLimit",
])

const emit = defineEmits(["toggle-event-edit", "local-storage-save"])

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
