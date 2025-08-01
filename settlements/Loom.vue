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
const spaceTimer = ref(null) //〔 The vessel for our new, faster magic.

onMounted(() => {
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedContent) loomContent.value = savedContent
  emit("update-content", getWrappedContent())
})

// ❖ The `Living Silence` Protocol (v3).
watch(loomContent, (newValue) => {
  if (pauseTimer.value) clearTimeout(pauseTimer.value)
  if (spaceTimer.value) clearTimeout(spaceTimer.value)
  if (!newValue.trim() || props.hotkeysMode === "confirmation") return

  // ❖ skip if empty line
  const currentContent = loomContent.value
  const lines = currentContent.split("\n")
  const lastLine = lines[lines.length - 1]
  if (!currentContent.trim() || !lastLine) {
    return
  }

  //〔 The 500ms "breath" timer.
  spaceTimer.value = setTimeout(() => {
    const currentContent = loomContent.value
    if (currentContent && !currentContent.endsWith(" ")) {
      loomContent.value += " "
    }
  }, 300)

  //〔 The 1000ms "silence" timer.
  pauseTimer.value = setTimeout(() => {
    const baseContent = currentContent.trimEnd()
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

defineExpose({ focus, updateContent })
</script>
