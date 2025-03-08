<!-- wrapper to textarea that encapsulates additional logic: scroll up / down and updating background position, so this paper-like lines are scrolling along the text -->
<template>
  <div
    class="w-full relative h-full p-3"
    :class="[isFocused ? 'bg-stone-700' : '']"
  >
    <div class="relative overflow-hidden rounded-xl h-full">
      <textarea
        ref="screenRef"
        :value="modelValue"
        @input="onInput"
        @scroll="onScroll"
        @focus="onFocus"
        @blur="onBlur"
        class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl"
        :class="{
          'bg-stone-400 text-stone-800': theme === 'light',
          'bg-stone-600 bg-lines-light selection-light text-stone-300':
            theme === 'dark',
        }"
        :style="{ backgroundPositionY }"
      />
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
const PAPER_EXTRA_SCROLL = 24
const PAPER_BG_OFFSET = -8

const props = defineProps([
  "modelValue",
  "theme",
  "update",
  "isAnyInputFocused",
])
const emit = defineEmits(["input", "update:modelValue", "focus", "blur"])

const screenRef = ref(null)

const isFocused = ref(false)
const backgroundPositionY = ref(`${PAPER_BG_OFFSET}px`)
const updateScrollButtons = ref(1)

const scrollTop = ref(0)
const scrollHeight = ref(0)
const clientHeight = ref(0)

onMounted(() => {
  addEventListener("keydown", onKeyDown)
  updateScrollDimensions()
})
onUnmounted(() => removeEventListener("keydown", onKeyDown))
watch(
  () => props.update,
  () => {
    screenRef.value.scrollTop = 0
    backgroundPositionY.value = `${PAPER_BG_OFFSET}px`
    nextTick(() => updateScrollButtons.value++)
  }
)
function onFocus() {
  isFocused.value = true
  emit("focus")
}
function onBlur() {
  isFocused.value = false
  emit("blur")
}
function onKeyDown(event) {
  if (document.activeElement === screenRef.value) {
    const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    if (navigationKeys.includes(event.key)) adjustPaperScroll()
    if (event.key === "Escape") screenRef.value.blur()
  } else if (screenRef.value && !props.isAnyInputFocused) {
    if (event.key === "o") {
      event.preventDefault()
      nextTick(() => {
        screenRef.value.focus()
        scrollToBot(screenRef.value, "auto")
        screenRef.value.setSelectionRange(
          screenRef.value.value.length,
          screenRef.value.value.length
        )
      })
    } else if (event.key === "e") {
      event.preventDefault()
      nextTick(() => {
        screenRef.value.focus()
        scrollToTop(screenRef.value, "auto")
        screenRef.value.setSelectionRange(0, 0)
      })
    }
  }
}
function onInput(event) {
  emit("update:modelValue", event.target.value)
  emit("input", event.target.value)
  adjustPaperScroll()
}
function onScroll(event) {
  if (!event) {
    backgroundPositionY.value = `${PAPER_BG_OFFSET}px`
    return
  }
  backgroundPositionY.value = `-${event.target.scrollTop - PAPER_BG_OFFSET}px`
  updateScrollDimensions()
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
