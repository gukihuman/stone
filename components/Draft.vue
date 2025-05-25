// components/Draft.vue
<template>
  <div
    class="h-[200px] flex-shrink-0 rounded-xl overflow-hidden p-2"
    :class="isTextareaFocused ? 'bg-coffee-800' : ''"
  >
    <div class="relative overflow-hidden rounded-lg h-full">
      <textarea
        ref="textareaEl"
        v-model="draft"
        @focus="onFocus(emit)"
        @blur="onBlur(emit)"
        @scroll="onScroll"
        @input="handleInput"
        class="w-full h-full py-5 px-8 bg-lines resize-none text-xl bg-coffee-300 text-coffee-850 rounded-lg placeholder:text-coffee-600 selection-paper scroll-paper"
        :style="{ backgroundPositionY: linesOffset }"
      />
    </div>
  </div>
</template>

<script setup>
const LOCAL_STORAGE_DRAFT_KEY = "stone-draft"
const emit = defineEmits(["lock-hotkeys", "unlock-hotkeys"])
const {
  isTextareaFocused,
  linesOffset,
  onFocus,
  onBlur,
  onScroll,
  adjustScrollTop,
  focus,
} = useFocused()
const textareaEl = ref(null)
const draft = ref("")
onMounted(() => {
  const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY)
  if (savedDraft) draft.value = savedDraft
})
defineExpose({ focus: () => focus(textareaEl) })
////////////////////////////////////////////////////////////////////////////////
const debouncedSaveDraft = debounce((text) => {
  localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, text)
  console.log(`✅ draft saved to localStorage [${timestamp()}]`)
})
function handleInput() {
  adjustScrollTop(textareaEl)
  debouncedSaveDraft(draft.value)
}
</script>
