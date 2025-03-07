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
let cursorPositionCache = null

watch(
  () => props.editEventId,
  () => updateMemoryRecords()
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
  updateMemoryRecords()
  addEventListener("keydown", onKeyDown)
  scrollTop.value = screenRef.value.scrollTop
  scrollHeight.value = screenRef.value.scrollHeight
  clientHeight.value = screenRef.value.clientHeight
})
onUnmounted(() => removeEventListener("keydown", onKeyDown))

function updateMemoryRecords() {
  try {
    const memoryRecords = JSON.parse(props.editEvent.memoryRecordsRaw)
    if (Array.isArray(memoryRecords)) editMemoryRecords.value = memoryRecords
  } catch (e) {}
}
function updateMemoryRecordsRaw() {
  editMemoryRecords.value = recordRefs.value.map((record) => record.innerHTML)
  props.editEvent.memoryRecordsRaw = JSON.stringify(editMemoryRecords.value)
  if (cursorPositionCache) nextTick(setCursorPosition)
}
function onScroll(event) {
  if (!event) {
    backgroundPositionY.value = `${PAPER_BG_OFFSET}px`
    return
  }
  backgroundPositionY.value = `-${event.target.scrollTop - PAPER_BG_OFFSET}px`

  scrollTop.value = screenRef.value.scrollTop
  scrollHeight.value = screenRef.value.scrollHeight
  clientHeight.value = screenRef.value.clientHeight
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
  cursorPositionCache = getCursorPosition(event.target)
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
function getCursorPosition(element) {
  const selection = window.getSelection()
  if (selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) return null

  const startPath = getNodePath(range.startContainer, element)
  const endPath = getNodePath(range.endContainer, element)

  return {
    recordIndex: recordRefs.value.indexOf(element),
    startPath: startPath,
    startOffset: range.startOffset,
    endPath: endPath,
    endOffset: range.endOffset,
  }
}
function setCursorPosition() {
  const cursor = cursorPositionCache
  if (!cursor) return

  const el = recordRefs.value[cursor.recordIndex]
  if (!el) return

  const startContainer = getNodeByPath(cursor.startPath, el)
  const endContainer = getNodeByPath(cursor.endPath, el)

  if (!startContainer || !endContainer) {
    console.log("Could not find nodes for cursor position")
    return
  }
  try {
    const range = document.createRange()
    range.setStart(startContainer, cursor.startOffset)
    range.setEnd(endContainer, cursor.endOffset)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    cursorPositionCache = null // Clear cache after setting
  } catch (e) {
    console.log("Error setting cursor position:", e)
  }
}
// Get the path from a node to the root element as an array of child indices
function getNodePath(node, root) {
  const path = []
  while (node !== root) {
    const parent = node.parentNode
    const index = Array.prototype.indexOf.call(parent.childNodes, node)
    path.unshift(index)
    node = parent
  }
  return path
}
// Follow a path from the root to find the corresponding node
function getNodeByPath(path, root) {
  let node = root
  for (const index of path) {
    node = node.childNodes[index]
    if (!node) return null // Path is invalid
  }
  return node
}
</script>
