<template>
  <div
    class="w-full p-3 relative h-full overflow-hidden"
    :class="[focusedIndex !== null ? 'bg-stone-700' : '']"
  >
    <div class="overflow-hidden rounded-xl h-full relative">
      <div
        ref="screenRef"
        class="h-full bg-stone-450 flex flex-col gap-2 scroll-light overflow-auto p-2 bg-lines items-center pb-4"
        @scroll="onScroll"
        :style="{ backgroundPositionY }"
      >
        <div
          v-for="(record, i) in editMemoryRecords"
          :key="i"
          class="relative w-full"
          :class="
            focusedIndex !== null && focusedIndex !== i ? 'opacity-40' : ''
          "
        >
          <div
            ref="recordRefs"
            v-html="record !== undefined ? record : 'id not found'"
            @input="onInput"
            @focus="onFocus(i)"
            @blur="onBlur"
            :contenteditable="record !== undefined"
            class="w-full min-h-[76px] flex-shrink-0 rounded-lg py-5 px-8 scroll-light bg-lines text-xl"
            :class="
              record !== undefined
                ? 'bg-stone-400 text-stone-800'
                : 'bg-stone-600 text-stone-300 cursor-default'
            "
            :style="{ backgroundPositionY: `${RECORD_BG_OFFSET}px` }"
          />
          <button
            v-if="focusedIndex !== null && focusedIndex === i"
            class="remove-button absolute bottom-3 right-14 px-4 pb-1 rounded-lg bg-stone-500 text-stone-300 hover:text-stone-200 opacity-50 hover:opacity-100 w-24"
            :class="
              record !== undefined ? 'hover:bg-stone-700' : 'hover:bg-stone-500'
            "
            @click="
              editEventId ? removeRecordFromEvent(i) : removeRecordFromTopic(i)
            "
          >
            remove
          </button>
        </div>
        <button
          v-if="editEventId"
          class="w-24 px-4 pb-1 rounded-lg bg-stone-500 text-stone-300 hover:bg-stone-600 hover:text-stone-200"
          @click="createRecord"
        >
          new
        </button>
      </div>
      <ScrollArrows
        v-if="
          screenRef &&
          updateScrollButtons &&
          screenRef.scrollHeight > screenRef.clientHeight
        "
        :targetRef="screenRef"
        :is-any-input-focused="isAnyInputFocused"
        :theme="theme"
        :scroll-top="scrollTop"
        :scroll-height="scrollHeight"
        :client-height="clientHeight"
      />
    </div>
  </div>
</template>
<script setup>
const PAPER_EXTRA_SCROLL = 28
const RECORD_BG_OFFSET = -8
const PAPER_BG_OFFSET = -28

const props = defineProps([
  "memoryRecordsById",
  "eventsById",
  "topicsById",
  "editEventId",
  "editTopicId",
  "isAnyInputFocused",
  "update",
  "theme",
])

const emit = defineEmits(["focus", "blur", "local-storage-save"])

const screenRef = ref(null)
const recordRefs = ref([])

const backgroundPositionY = ref(`${PAPER_BG_OFFSET}px`)

const focusedIndex = ref(null)
const updateScrollButtons = ref(1)

const scrollTop = ref(0)
const scrollHeight = ref(0)
const clientHeight = ref(0)

const debouncedUpdateMemoryRecordsRaw = debounce(updateMemoryRecordsRaw)

const editMemoryRecords = ref([]) // copy for edit

watch(
  () => [props.editEventId, props.editTopicId],
  () => loadMemoryRecordsIntoFields()
)
watch(
  () => props.update,
  () => {
    screenRef.value.scrollTop = 0
    backgroundPositionY.value = `${PAPER_BG_OFFSET}px`
    nextTick(() => updateScrollButtons.value++)
  }
)
onMounted(() => {
  loadMemoryRecordsIntoFields()
  addEventListener("keydown", onKeyDown)
  updateScrollDimensions()
})
onUnmounted(() => removeEventListener("keydown", onKeyDown))

function loadMemoryRecordsIntoFields() {
  const editEvent = props.eventsById[props.editEventId]
  const editTopic = props.topicsById[props.editTopicId]
  try {
    if (props.editEventId) {
      const memoryRecords = JSON.parse(editEvent.memoryRecordsRaw)
      if (Array.isArray(memoryRecords)) {
        editMemoryRecords.value = memoryRecords
        nextTick(updateScrollDimensions)
      }
    } else {
      editMemoryRecords.value = editTopic.memoryIds.map((memoryId) => {
        return props.memoryRecordsById[memoryId]
      })
      nextTick(updateScrollDimensions)
    }
  } catch (e) {}
}
function updateMemoryRecordsRaw() {
  if (props.editEventId) {
    const editEvent = props.eventsById[props.editEventId]
    const newMemoryRecords = recordRefs.value.map((record) => record.innerText)
    editEvent.memoryRecordsRaw = JSON.stringify(newMemoryRecords)
    editEvent.memoryIds.forEach((memoryId, index) => {
      props.memoryRecordsById[memoryId] = newMemoryRecords[index]
    })
  } else {
    const editTopic = props.topicsById[props.editTopicId]
    recordRefs.value.forEach((recordRef, i) => {
      const memoryId = editTopic.memoryIds[i]
      const eventToUpdate = findEventWithMemoryId(memoryId)
      const memoryRecordIndex = eventToUpdate.memoryIds.indexOf(memoryId)
      try {
        let memoryRecords = JSON.parse(eventToUpdate.memoryRecordsRaw)
        memoryRecords[memoryRecordIndex] = recordRef.innerText
        eventToUpdate.memoryRecordsRaw = JSON.stringify(memoryRecords)
        props.memoryRecordsById[memoryId] = recordRef.innerText
      } catch (e) {}
    })
  }
}
function onScroll(event) {
  if (!event) {
    backgroundPositionY.value = `${PAPER_BG_OFFSET}px`
    return
  }
  backgroundPositionY.value = `-${event.target.scrollTop - PAPER_BG_OFFSET}px`
  updateScrollDimensions()
}
function onFocus(index) {
  focusedIndex.value = index
  emit("focus")
}
function onBlur(event) {
  if (
    event.relatedTarget &&
    event.relatedTarget.classList.contains("remove-button")
  ) {
    setTimeout(() => {
      focusedIndex.value = null
      emit("blur")
    }, 300)
    return
  }
  focusedIndex.value = null
  emit("blur")
}
function onInput() {
  debouncedUpdateMemoryRecordsRaw()
  emit("local-storage-save")
  adjustPaperScroll()
}
function onKeyDown(event) {
  if (focusedIndex.value) {
    const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    if (navigationKeys.includes(event.key)) adjustPaperScroll()
  }
  if (event.key === "Escape") {
    recordRefs.value.forEach((record) => {
      record.blur()
      window.getSelection().removeAllRanges()
    })

    updateMemoryRecordsRaw()
  }
}
function adjustPaperScroll() {
  const el = screenRef.value
  if (!el) return
  const initialScrollTop = el.scrollTop
  requestAnimationFrame(() => {
    if (el.scrollTop === initialScrollTop) return
    if (el.scrollTop < initialScrollTop) {
      el.scrollTop = Math.max(0, el.scrollTop - PAPER_EXTRA_SCROLL)
    } else {
      el.scrollTop = Math.min(
        el.scrollHeight,
        el.scrollTop + PAPER_EXTRA_SCROLL
      )
    }
  })
}
function updateScrollDimensions() {
  scrollTop.value = screenRef.value.scrollTop
  scrollHeight.value = screenRef.value.scrollHeight
  clientHeight.value = screenRef.value.clientHeight
  updateScrollButtons.value++
}
function findEventWithMemoryId(memoryId) {
  for (const eventId in props.eventsById) {
    const event = props.eventsById[eventId]
    if (event.memoryIds.includes(memoryId)) {
      return event
    }
  }
  return null
}
function createRecord() {
  const id = newId()
  editMemoryRecords.value.push("")
  const editEvent = props.eventsById[props.editEventId]
  editEvent.memoryIds.push(id)
  props.memoryRecordsById[id] = ""
  focusedIndex.value = editMemoryRecords.value.length - 1
  nextTick(() => {
    recordRefs.value[focusedIndex.value].focus()
    scrollToBot(screenRef.value)
    updateMemoryRecordsRaw()
  })
}
function removeRecordFromEvent(index, event) {
  const editEvent = event || props.eventsById[props.editEventId]

  delete props.memoryRecordsById[editEvent.memoryIds[index]]

  const memoryRecords = JSON.parse(editEvent.memoryRecordsRaw)
  memoryRecords.splice(index, 1)
  editEvent.memoryRecordsRaw = JSON.stringify(memoryRecords)

  editEvent.memoryIds.splice(index, 1)
  editMemoryRecords.value.splice(index, 1)

  focusedIndex.value = null
}
function removeRecordFromTopic(index) {
  const editTopic = props.topicsById[props.editTopicId]
  const memoryId = editTopic.memoryIds[index]

  delete props.memoryRecordsById[memoryId]

  const memoryIds = JSON.parse(editTopic.memoryIdsRaw)
  memoryIds.splice(index, 1)
  editTopic.memoryIdsRaw = JSON.stringify(memoryIds)

  editTopic.memoryIds.splice(index, 1)
  editMemoryRecords.value.splice(index, 1)

  const eventToUpdate = findEventWithMemoryId(memoryId)
  if (!eventToUpdate) return // id not found
  const memoryRecordIndex = eventToUpdate.memoryIds.indexOf(memoryId)
  removeRecordFromEvent(memoryRecordIndex, eventToUpdate)
}
</script>
