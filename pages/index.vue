// ~/pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[1280px] flex h-screen p-1 gap-2">
      <!-- # left column (The Stream) -->
      <div class="w-[260px] flex-shrink-0 flex flex-col gap-2 p-1">
        <div class="bg-coffee-600 overflow-auto h-full scroll-screen">
          <transition-group
            name="flow-list"
            tag="div"
            class="flex flex-col gap-2"
          >
            <div
              v-for="wave in displayWaves"
              :key="wave._id"
              class="h-[65px] flex rounded-xl gap-[6px]"
            >
              <div
                v-if="wave._id === selectedWaveId"
                class="bg-carrot-500 my-1 w-[10px] rounded-md"
              ></div>
              <div
                class="px-4 py-2 w-full rounded-xl"
                :class="{
                  'bg-coffee-500 selection-paper': wave.source === 'guki',
                  'bg-moss-350 selection-screen': wave.source === 'roxanne',
                  'bg-coffee-700 selection-paper': wave.source === 'body',
                }"
              >
                <p
                  class="line-clamp-2"
                  :class="{
                    'text-coffee-850 text-lg leading-[22px]':
                      wave.source === 'guki',
                    'text-moss-100 font-fira-code': wave.source === 'roxanne',
                    'text-coffee-200 text-lg font-fira-code':
                      wave.source === 'body',
                  }"
                >
                  {{ wave.data }}
                </p>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- # middle column -->
      <div class="flex-grow h-full flex flex-col gap-2">
        <!-- ## loom -->
        <div class="h-[200px]">
          <Loom
            ref="loomRef"
            v-show="currentMode !== 'confirmation'"
            :mode="currentMode"
            @enter-confirmation-mode="enterConfirmationMode"
            @set-mode="onSetMode"
          />
        </div>
        <!-- ## screen -->
        <div class="flex-grow p-2 bg-moss-350 rounded-xl overflow-hidden">
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
import { SPELLS } from "~/shared/lexicon"

const { currentMode, setMode, setupHotkeys } = useHotkeys()

const loomRef = ref(null)
const waves = ref([])
const selectedWaveId = ref(null)
const isCommitting = ref(false)

// --- Computed Properties ---
const displayWaves = computed(() => waves.value.slice(-9).reverse())

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
    const previewContent = loomContent.replace(SPELLS.COMMIT, "").trim()
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
