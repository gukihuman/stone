<!-- wrapper to textarea that encapsulates additional logic: scroll up / down and updating background position, so this paper-like lines are scrolling along the text -->
<template>
  <div class="relative h-full p-3" :class="[isFocused ? 'bg-stone-700' : '']">
    <div class="relative overflow-hidden rounded-xl h-full">
      <textarea
        ref="paperRef"
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
      ></textarea>
      <!-- scroll buttons -->
      <div
        v-if="
          updateScrollButtons &&
          paperRef &&
          paperRef.scrollHeight > paperRef.clientHeight
        "
        class="flex flex-col absolute bottom-4 right-4"
      >
        <div
          @click="onScrollTop"
          class="group pb-[3px] p-1"
          :class="[
            !disabledAfterClickTop && paperRef.scrollTop !== 0
              ? 'cursor-pointer opacity-60'
              : 'opacity-25',
          ]"
        >
          <button
            class="size-8 pb-1 rounded-full bg-stone-500 text-stone-400 cursor-default"
            :class="{
              'group-hover:text-stone-300 group-hover:bg-stone-800 cursor-pointer':
                theme === 'light' &&
                !disabledAfterClickTop &&
                paperRef.scrollTop !== 0,
              'group-hover:text-stone-200 group-hover:bg-stone-800 cursor-pointer':
                theme === 'dark' &&
                !disabledAfterClickTop &&
                paperRef.scrollTop !== 0,
            }"
          >
            <IconArrow class="w-3 -rotate-90 inline-block" />
          </button>
        </div>
        <div
          @click="onScrollBot"
          class="group pt-[3px] p-1"
          :class="[
            !disabledAfterClickBot &&
            paperRef.scrollTop + paperRef.clientHeight !== paperRef.scrollHeight
              ? 'cursor-pointer opacity-60'
              : 'opacity-25',
          ]"
        >
          <button
            class="size-8 pb-1 rounded-full bg-stone-500 text-stone-400 cursor-default"
            :class="{
              'group-hover:text-stone-300 group-hover:bg-stone-800 cursor-pointer':
                theme === 'light' &&
                !disabledAfterClickBot &&
                paperRef.scrollTop + paperRef.clientHeight !==
                  paperRef.scrollHeight,
              'group-hover:text-stone-200 group-hover:bg-stone-800 cursor-pointer':
                theme === 'dark' &&
                !disabledAfterClickBot &&
                paperRef.scrollTop + paperRef.clientHeight !==
                  paperRef.scrollHeight,
            }"
          >
            <IconArrow class="w-3 rotate-90 inline-block" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import scrollToTop from "./utils/scrollToTop"
import scrollToBot from "./utils/scrollToBot"

const PAPER_EXTRA_SCROLL = 24
const PAPER_BG_OFFSET = -8
const DISABLED_AFTER_CLICK_DELAY = 1000

const props = defineProps(["modelValue", "theme", "update", "focus", "blur"])
const emit = defineEmits(["input", "update:modelValue"])

const paperRef = ref(null)
const isFocused = ref(false)
const backgroundPositionY = ref(`${PAPER_BG_OFFSET}px`)
const disabledAfterClickTop = ref(false)
const disabledAfterClickBot = ref(false)
const updateScrollButtons = ref(1)

onMounted(() => addEventListener("keydown", onKeyDown))
watch(
  () => props.update,
  () => {
    paperRef.value.scrollTop = 0
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
  if (document.activeElement !== paperRef.value) {
    if (event.key === "i") onScrollTop()
    else if (event.key === "g") onScrollBot()
    if (event.key === "o") {
      event.preventDefault()
      nextTick(() => {
        paperRef.value.focus()
        scrollToBot(paperRef.value, "auto")
        paperRef.value.setSelectionRange(
          paperRef.value.value.length,
          paperRef.value.value.length
        )
      })
    } else if (event.key === "e") {
      event.preventDefault()
      nextTick(() => {
        paperRef.value.focus()
        scrollToTop(paperRef.value, "auto")
        paperRef.value.setSelectionRange(0, 0)
      })
    }
  } else {
    const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
    if (navigationKeys.includes(event.key)) adjustPaperScroll()
    if (event.key === "Escape") paperRef.value.blur()
  }
}
function onScrollTop() {
  scrollToTop(paperRef.value)
  disabledAfterClickTop.value = true
  setTimeout(
    () => (disabledAfterClickTop.value = false),
    DISABLED_AFTER_CLICK_DELAY
  )
}
function onScrollBot() {
  scrollToBot(paperRef.value)
  disabledAfterClickBot.value = true
  setTimeout(
    () => (disabledAfterClickBot.value = false),
    DISABLED_AFTER_CLICK_DELAY
  )
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
}
function adjustPaperScroll() {
  const el = paperRef.value
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
</script>
<style>
.bg-lines {
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.04) 3px,
    transparent 4px
  );
  background-size: 100% 28px;
}
.bg-lines-light {
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.04) 3px,
    transparent 4px
  );
  background-size: 100% 28px;
}
</style>
