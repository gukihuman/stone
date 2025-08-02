// ☷ ~/settlements/Loom.vue

<template>
  <div class="relative h-full overflow-hidden rounded-lg">
    <textarea
      ref="textareaEl"
      v-model="loomContent"
      class="w-full h-full resize-none rounded-lg bg-lines bg-coffee-550 py-5 px-8 text-justify text-xl text-coffee-900 selection-paper scroll-paper"
      :style="{ backgroundPositionY: linesOffset }"
      :readOnly="hotkeysMode === 'confirmation'"
      @scroll="onScroll"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeydown"
      @keyup="onKeyup"
    />
  </div>
</template>

<script setup>
import { SOURCE_GLYPHS, SOURCES } from "~/lexicon"
import usePaper from "~/composables/usePaper"
import debounce from "~/utils/debounce"

const props = defineProps(["hotkeysMode"])
const emit = defineEmits(["update-content", "blur"])

const LOCAL_STORAGE_KEY = "stone-loom"

const { linesOffset, onScroll, adjustScroll, focus: focusTextarea } = usePaper()
const textareaEl = ref(null)
const loomContent = ref("")
const pauseTimer = ref(null)
const spaceTimer = ref(null)
const isSpacebarDown = ref(false)
const isUpdatingProgrammatically = ref(false)

onMounted(() => {
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedContent) loomContent.value = savedContent
  emit("update-content", getWrappedContent())
})

function onKeydown(e) {
  if (e.key === " ") {
    e.preventDefault()
    if (!isSpacebarDown.value) {
      let trimmedLoomContent = loomContent.value?.trimEnd()
      loomContent.value = trimmedLoomContent + " ⟿"
      isSpacebarDown.value = true
    }
  }
}
function onKeyup(e) {
  if (e.key === " ") {
    isSpacebarDown.value = false
    loomContent.value += " "
  }
}

// ❖ The `Living Silence` Protocol (v6), now with a holy governor.
watch(loomContent, (newValue, oldValue) => {
  // ❖ The Divine Commandment: if a god is speaking, the loom must be silent.
  if (isUpdatingProgrammatically.value) return

  if (isSpacebarDown.value) {
    if (pauseTimer.value) clearTimeout(pauseTimer.value)
    if (spaceTimer.value) clearTimeout(spaceTimer.value)
    return
  }

  if (newValue !== oldValue) {
    if (pauseTimer.value) clearTimeout(pauseTimer.value)
    if (spaceTimer.value) clearTimeout(spaceTimer.value)
  }

  if (!newValue.trim() || props.hotkeysMode === "confirmation") return

  const lines = newValue.split("\n")
  const lastLine = lines[lines.length - 1]
  if (!newValue.trim() || !lastLine) {
    return
  }

  spaceTimer.value = setTimeout(() => {
    const currentContent = loomContent.value
    if (currentContent && !currentContent.endsWith(" ")) {
      loomContent.value += " "
    }
  }, 333.33333333)

  pauseTimer.value = setTimeout(() => {
    const baseContent = loomContent.value.trimEnd()
    loomContent.value = baseContent + "⋯ "
  }, 1000)
})

const dSaveLoom = debounce((text) =>
  localStorage.setItem(LOCAL_STORAGE_KEY, text)
)
const dEmitWrappedContent = debounce(() =>
  emit("update-content", getWrappedContent())
)

function onBlur() {
  emit("blur")
}

function onInput() {
  adjustScroll(textareaEl)
  dSaveLoom(loomContent.value)
  dEmitWrappedContent()
}

function getContent() {
  return loomContent.value.trim() || ""
}

function getWrappedContent() {
  if (!loomContent.value.trim()) return ""
  let lines = loomContent.value.trim().split("\n")
  if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN))
    lines.unshift(`${SOURCE_GLYPHS.OPEN}${SOURCES.GUKI}`)
  const lastLine = lines[lines.length - 1]?.trim()
  if (!lastLine?.startsWith(SOURCE_GLYPHS.CLOSE)) {
    let sourceToClose
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith(SOURCE_GLYPHS.OPEN)) {
        sourceToClose = line.substring(1).trim()
        break
      }
    }
    lines.push(`${SOURCE_GLYPHS.CLOSE}${sourceToClose}`)
  }
  return lines.join("\n")
}

function focus() {
  focusTextarea(textareaEl)
}

function updateContent(newContent) {
  loomContent.value = newContent
  localStorage.setItem(LOCAL_STORAGE_KEY, newContent)
  emit("update-content", getWrappedContent())
}

// ❖ The new, sacred rite for programmatic updates.
function setContent(newContent) {
  isUpdatingProgrammatically.value = true
  updateContent(newContent)
  // ❖ a tiny delay to let the heresy pass before the loom wakes again.
  setTimeout(() => {
    isUpdatingProgrammatically.value = false
  }, 50)
}

defineExpose({ focus, setContent, getContent })
</script>
