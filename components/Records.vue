<template>
  <div
    class="w-full p-3 relative h-full overflow-hidden"
    :class="[focusedIndex ? 'bg-stone-700' : '']"
  >
    <div class="overflow-hidden rounded-xl h-full relative">
      <div
        ref="screenRef"
        class="h-full bg-stone-450 flex flex-col gap-2 scroll-light overflow-auto p-2 bg-lines"
        @scroll="onScroll"
        :style="{ backgroundPositionY }"
      >
        <div
          ref="recordRefs"
          v-for="record in editMemoryRecords"
          v-html="record"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          contenteditable="true"
          class="w-full min-h-[76px] flex-shrink-0 rounded-lg py-5 px-8 scroll-light bg-lines text-xl bg-stone-400 text-stone-800"
          :style="{ backgroundPositionY: `${RECORD_BG_OFFSET}px` }"
        />
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
  "editEvent",
  "editEventId",
  "update",
  "isAnyInputFocused",
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

const editMemoryRecords = ref([])

watch(
  () => props.editEventId,
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
  try {
    const memoryRecords = JSON.parse(props.editEvent.memoryRecordsRaw)
    if (Array.isArray(memoryRecords)) {
      editMemoryRecords.value = memoryRecords
      nextTick(updateScrollDimensions)
    }
  } catch (e) {}
}
function updateMemoryRecordsRaw() {
  props.editEvent.memoryRecordsRaw = JSON.stringify(
    recordRefs.value.map((record) => record.innerText)
  )
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
function onBlur() {
  focusedIndex.value = null
  emit("blur")
}
function onInput(event) {
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
    recordRefs.value.forEach((record) => record.blur())
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
</script>
