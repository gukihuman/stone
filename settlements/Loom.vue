<template>
  <div class="relative overflow-hidden rounded-lg h-full">
    <textarea
      ref="textareaEl"
      v-model="loomContent"
      @scroll="onScroll"
      @input="onInput"
      @blur="onBlur"
      class="w-full h-full py-5 px-8 bg-lines resize-none text-xl bg-coffee-550 rounded-lg text-coffee-900 selection-paper scroll-paper text-justify"
      :style="{ backgroundPositionY: linesOffset }"
      :readOnly="hotkeysMode === 'confirmation'"
    />
  </div>
</template>

<script setup>
import { SOURCE_GLYPHS, SOURCES } from "~/lexicon"

const props = defineProps(["hotkeysMode"])
const emit = defineEmits(["update-content", "blur"])

const LOCAL_STORAGE_KEY = "stone-loom"

const { linesOffset, onScroll, adjustScroll, focus: focusTextarea } = usePaper()
const textareaEl = ref(null)
const loomContent = ref("")

onMounted(() => {
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (savedContent) loomContent.value = savedContent
  emit("update-content", getWrappedContent())
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

//〔 this is the new method for index.vue to call.
function updateContent(newContent) {
  loomContent.value = newContent
  localStorage.setItem(LOCAL_STORAGE_KEY, newContent)
  emit("update-content", getWrappedContent())
}

defineExpose({ focus, updateContent })
</script>
