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
        @focus="onFocus"
        @blur="onBlur"
        class="w-full h-full py-5 px-8 bg-lines resize-none text-xl bg-coffee-350 rounded-lg text-coffee-900 selection-paper scroll-paper"
        :style="{ backgroundPositionY: linesOffset }"
        :readOnly="mode === 'confirmation'"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["mode"])
const emit = defineEmits(["enter-confirmation-mode", "set-mode"])

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
function onFocus() {
  emit("set-mode", "input")
}
function onBlur() {
  emit("set-mode", "normal")
}

function onInput() {
  adjustScroll(textareaEl)
  dSaveLoom(loomContent.value)

  // Client-side parser reflex
  if (loomContent.value.includes("#cm")) {
    emit("enter-confirmation-mode")
  }
}

function clearLoom() {
  loomContent.value = ""
  localStorage.setItem(LOCAL_STORAGE_KEY, "")
}

function removeCommitTag() {
  loomContent.value = loomContent.value.replace("#cm", "").trim()
  dSaveLoom(loomContent.value) // Save the cleaned content
}

function focus() {
  focusTextarea(textareaEl)
}

defineExpose({
  focus,
  content: loomContent,
  clear: clearLoom,
  removeCommitTag,
})
</script>
