// ~/components/Loom.vue
<template>
  <div class="h-full flex-shrink-0 rounded-xl overflow-hidden p-2">
    <div
      class="relative overflow-hidden rounded-lg h-full ring-[8px] ring-coffee-500 focus-within:ring-coffee-750"
    >
      <textarea
        ref="textareaEl"
        v-model="loomContent"
        @scroll="onScroll"
        @input="onInput"
        @blur="onBlur"
        class="w-full h-full py-5 px-8 bg-lines resize-none text-xl bg-coffee-450 rounded-lg text-coffee-900 selection-paper scroll-paper"
        :style="{ backgroundPositionY: linesOffset }"
        :readOnly="hotkeysMode === 'confirmation'"
      />
    </div>
  </div>
</template>

<script setup>
import { SOURCE_GLYPHS, SOURCES } from "~/lexicon"

const props = defineProps(["hotkeysMode"])
const emit = defineEmits(["update-content", "on-loom-blur"])

const LOCAL_STORAGE_KEY = "stone-loom"

const { linesOffset, onScroll, adjustScroll, focus: focusTextarea } = usePaper()
const textareaEl = ref(null)
const loomContent = ref("")

onMounted(() => {
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedContent) loomContent.value = savedContent
})

const dSaveLoom = debounce((text) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, text)
})
const dEmitWrappedContent = debounce(() => {
  emit("update-content", getWrappedContent())
})
function onBlur() {
  emit("on-loom-blur")
}

function onInput() {
  adjustScroll(textareaEl)
  dSaveLoom(loomContent.value)
  dEmitWrappedContent()
}

function getWrappedContent() {
  let lines = loomContent.value.trim()
    ? loomContent.value.trim().split("\n")
    : []
  // step 1 is prepend opening glyph if missing
  if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
    lines.unshift(`${SOURCE_GLYPHS.OPEN}${SOURCES.GUKI}`)
  }
  // step 2 is append closing glyph if missing, using the robust reverse loop
  const lastLine = lines[lines.length - 1]?.trim()
  if (!lastLine?.startsWith(SOURCE_GLYPHS.CLOSE)) {
    let sourceToClose // guaranteed by step 1
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith(SOURCE_GLYPHS.OPEN)) {
        sourceToClose = line.substring(1).trim()
        break // found the last opened source
      }
    }
    lines.push(`${SOURCE_GLYPHS.CLOSE}${sourceToClose}`)
  }
  return lines.join("\n")
}

function clearLoom() {
  loomContent.value = ""
  localStorage.setItem(LOCAL_STORAGE_KEY, "")
}

function focus() {
  focusTextarea(textareaEl)
}

defineExpose({
  focus,
  clear: clearLoom,
})
</script>
