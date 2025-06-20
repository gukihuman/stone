// ~/components/Draft.vue
<template>
  <div class="h-[200px] flex-shrink-0 rounded-xl overflow-hidden p-2">
    <div
      class="relative overflow-hidden rounded-lg h-full ring-[8px] ring-coffee-500 focus-within:ring-coffee-750"
    >
      <textarea
        ref="textareaEl"
        v-model="draft"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        @scroll="onScroll"
        @input="handleInput"
        class="w-full h-full py-5 px-8 bg-lines resize-none text-xl bg-coffee-350 text-coffee-850 rounded-lg placeholder:text-coffee-600 selection-paper scroll-paper"
        :style="{ backgroundPositionY: linesOffset }"
      />
    </div>
  </div>
</template>

<script setup>
const LOCAL_STORAGE_DRAFT_KEY = "stone-draft"
const emit = defineEmits(["lock-hotkeys", "unlock-hotkeys"])
const { linesOffset, onScroll, adjustScroll, focus } = usePaper()
const textareaEl = ref(null)
const draft = ref("")
onMounted(() => {
  const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY)
  if (savedDraft) draft.value = savedDraft
})
////////////////////////////////////////////////////////////////////////////////
const debouncedSaveDraft = debounce((text) => {
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, text)
})
function handleInput() {
  adjustScroll(textareaEl)
  debouncedSaveDraft(draft.value)
}
function clearDraft() {
  draft.value = ""
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, "")
}
defineExpose({
  focus: () => focus(textareaEl),
  draft,
  clearDraft,
})
</script>
