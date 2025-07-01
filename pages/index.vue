// ~/pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[900px] flex h-screen p-1 gap-2">
      <!-- # simplified central column -->
      <div class="flex-grow h-full flex flex-col gap-2">
        <Loom
          ref="loomRef"
          :mode="currentMode"
          @enter-confirmation-mode="enterConfirmationMode"
        />
        <!-- ## screen -->
        <div class="flex-grow p-2 rounded-xl bg-moss-350 overflow-hidden">
          <div class="overflow-hidden h-full">
            <div class="overflow-hidden rounded-lg h-full">
              <div
                class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
              >
                {{ screen }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Loom from "~/components/Loom.vue"

const { currentMode, setMode, setupHotkeys } = useHotkeys()

const loomRef = ref(null)
const screen = ref("")

let cleanupHotkeys

// --- Hotkey & Mode Logic ---
const normalModeShortcuts = {
  o: () => {
    setMode("input")
    loomRef.value?.focus()
  },
}

const inputModeShortcuts = {
  Escape: () => {
    setMode("normal")
    document.activeElement?.blur()
  },
}

const confirmationModeShortcuts = {
  Enter: () => {
    commit(loomRef.value.content)
    loomRef.value?.clear()
    screen.value = ""
    setMode("normal")
  },
  Escape: () => {
    loomRef.value?.removeCommitTag()
    screen.value = ""
    setMode("normal")
  },
}

onMounted(() => {
  cleanupHotkeys = setupHotkeys({
    normal: normalModeShortcuts,
    input: inputModeShortcuts,
    confirmation: confirmationModeShortcuts,
  })
})

function enterConfirmationMode() {
  setMode("confirmation")
  const loomContent = loomRef.value?.content || ""
  const previewContent = loomContent.replace("#commit", "").trim()
  screen.value = `[CONFIRM COMMIT]\n\n${previewContent}`
  document.activeElement?.blur()
}
</script>
