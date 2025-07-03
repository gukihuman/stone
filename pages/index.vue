// ~/pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[1280px] flex h-screen p-1 gap-2">
      <!-- # left column (The Stream) -->
      <div class="w-[260px] flex-shrink-0 flex flex-col gap-2">
        <div
          class="p-3 rounded-xl bg-coffee-600 text-stone-300 font-fira-code text-sm overflow-auto h-full scroll-screen cursor-default selection-paper"
        >
          <transition-group name="flow-list" tag="div">
            <div
              v-for="wave in displayWaves"
              :key="wave._id"
              class="mb-3 p-1 rounded-md transition-colors"
              :class="{ 'bg-coffee-750': wave._id === selectedWaveId }"
            >
              <span class="text-coffee-100 font-bold">{{ wave.source }}:</span>
              <p
                class="whitespace-pre-wrap pl-2 text-stone-200 selection-paper"
              >
                {{ wave.data }}
              </p>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- # middle column -->
      <div class="flex-grow h-full flex flex-col gap-2">
        <Loom
          ref="loomRef"
          :mode="currentMode"
          @enter-confirmation-mode="enterConfirmationMode"
          @set-mode="onSetMode"
        />
        <div class="flex-grow p-2 rounded-xl bg-moss-350 overflow-hidden">
          <div class="overflow-hidden h-full">
            <div
              class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
            >
              {{ screenContent }}
            </div>
          </div>
        </div>
      </div>

      <!-- # right column -->
      <div class="w-[260px] flex-shrink-0">
        <!-- future right panel content -->
      </div>
    </div>
  </div>
</template>

<script setup>
import Loom from "~/components/Loom.vue"

const { currentMode, setMode, setupHotkeys } = useHotkeys()

const loomRef = ref(null)
const waves = ref([])
const selectedWaveId = ref(null)
const isCommitting = ref(false)

// --- Computed Properties ---
const displayWaves = computed(() => waves.value.slice(-20).reverse())

const focusedWave = computed(() => {
  if (!selectedWaveId.value) return null
  return waves.value.find((w) => w._id === selectedWaveId.value)
})

const screenContent = computed(() => {
  // Priority 1: Show committing status if active
  if (isCommitting.value) {
    return "[COMMITTING...]"
  }
  // Priority 2: Show confirmation preview if in that mode
  if (currentMode.value === "confirmation") {
    const loomContent = loomRef.value?.content || ""
    const previewContent = loomContent.replace("#commit", "").trim()
    return `[CONFIRM COMMIT]\n\n${previewContent}`
  }
  // Default: Show the focused wave's data
  return focusedWave.value ? focusedWave.value.data : ""
})

let cleanupHotkeys

// --- Hotkey & Mode Logic ---
function selectNextWave() {
  const currentWaves = displayWaves.value
  if (currentWaves.length === 0) return
  const currentIndex = currentWaves.findIndex(
    (w) => w._id === selectedWaveId.value
  )
  if (currentIndex === -1 || currentIndex === currentWaves.length - 1) {
    selectedWaveId.value = currentWaves[0]._id
  } else {
    selectedWaveId.value = currentWaves[currentIndex + 1]._id
  }
}

function selectPreviousWave() {
  const currentWaves = displayWaves.value
  if (currentWaves.length === 0) return
  const currentIndex = currentWaves.findIndex(
    (w) => w._id === selectedWaveId.value
  )
  if (currentIndex <= 0) {
    selectedWaveId.value = currentWaves[currentWaves.length - 1]._id
  } else {
    selectedWaveId.value = currentWaves[currentIndex - 1]._id
  }
}

const normalModeShortcuts = {
  o: () => {
    setMode("input")
    loomRef.value?.focus()
  },
  g: selectNextWave,
  i: selectPreviousWave,
}

const inputModeShortcuts = {
  Escape: () => {
    setMode("normal")
    document.activeElement?.blur()
  },
}

const confirmationModeShortcuts = {
  Enter: async () => {
    isCommitting.value = true // Set pending state ON
    try {
      const { success } = await commit(loomRef.value.content)
      if (success) {
        await fetchFlow() // This will now auto-select the new wave
      }
      loomRef.value?.clear()
    } catch (error) {
      console.error("error during commit", error)
      // We could show an error on screen here
    } finally {
      isCommitting.value = false // Set pending state OFF
      setMode("normal")
    }
  },
  Escape: () => {
    loomRef.value?.removeCommitTag()
    setMode("normal")
  },
}

// --- Lifecycle & Data ---
onMounted(() => {
  cleanupHotkeys = setupHotkeys({
    normal: normalModeShortcuts,
    input: inputModeShortcuts,
    confirmation: confirmationModeShortcuts,
  })
  fetchFlow()
})

onUnmounted(() => {
  if (cleanupHotkeys) cleanupHotkeys()
})

async function fetchFlow() {
  const { success, waves: fetchedWaves } = await getFlow()
  if (success) {
    waves.value = fetchedWaves
    // After fetching, automatically select the most recent wave
    if (displayWaves.value.length > 0) {
      selectedWaveId.value = displayWaves.value[0]._id
    }
  } else {
    console.error("failed to fetch flow")
  }
}

function enterConfirmationMode() {
  setMode("confirmation")
  document.activeElement?.blur()
}

// Custom handler for @set-mode to guard against blur in confirmation
function onSetMode(newMode) {
  if (currentMode.value !== "confirmation") {
    setMode(newMode)
  }
}
</script>

<style scoped>
.flow-list-move,
.flow-list-enter-active,
.flow-list-leave-active {
  transition: all 0.3s ease;
}
.flow-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.flow-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.flow-list-leave-active {
  position: absolute;
}
</style>
