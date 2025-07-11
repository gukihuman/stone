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
                class="px-4 py-2 w-full rounded-xl cursor-default"
                :class="{
                  'bg-coffee-500 selection-paper': wave.source === 'guki',
                  'bg-moss-350 selection-screen': wave.source === 'roxanne',
                  'bg-coffee-700 selection-paper':
                    wave.source !== 'guki' && wave.source !== 'roxanne',
                }"
              >
                <p
                  class="line-clamp-2"
                  :class="{
                    'text-coffee-850 text-lg leading-[22px]':
                      wave.source === 'guki',
                    'text-moss-100 font-fira-code': wave.source !== 'guki',
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
            @set-mode="onSetMode"
          />
        </div>
        <!-- ## screen -->
        <div class="flex-grow p-2 bg-moss-350 rounded-xl overflow-hidden">
          <div class="overflow-hidden h-full">
            <div
              class="w-full h-full bg-moss-400 text-stone-300 rounded-lg py-5 px-8 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
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
import { SOURCE_GLYPHS, SOURCES } from "~/lexicon"

const COPY_CONFIRMATION_DURATION = 1000

const { currentMode, setMode, setupHotkeys } = useHotkeys()

const loomRef = ref(null)
const waves = ref([])
const selectedWaveId = ref(null)
const isCommitting = ref(false)
const isCopyingWave = ref(false)
const isCopyingContext = ref(false)
const isCopyingPrompt = ref(false)

// --- Computed Properties ---
const displayWaves = computed(() => waves.value.slice(-9).reverse())

const focusedWave = computed(() => {
  if (!selectedWaveId.value) return null
  return waves.value.find((w) => w._id === selectedWaveId.value)
})

const screenContent = computed(() => {
  if (isCopyingPrompt.value) return "[PROMPT COPIED TO CLIPBOARD]"
  if (isCopyingContext.value) return "[CONTEXT COPIED TO CLIPBOARD]"
  if (isCopyingWave.value) return "[WAVE COPIED TO CLIPBOARD]"
  if (isCommitting.value) return "[COMMITTING...]"
  if (currentMode.value === "confirmation") {
    const loomContent = loomRef.value?.getWrappedContent() || ""
    return `[CONFIRM COMMIT]\n\n${loomContent}`
  }
  return focusedWave.value
    ? `[${focusedWave.value.source}]\n\n${focusedWave.value.data}`
    : ""
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

async function onCommit() {
  if (!loomRef.value || isCommitting.value) return
  const contentToCommit = loomRef.value.getWrappedContent()
  if (!contentToCommit) return

  isCommitting.value = true
  try {
    // The commit function now returns a unified response object
    const response = await commit(contentToCommit)

    if (response.success) {
      await fetchFlow() // Always fetch the new flow first

      if (response.prompt) {
        // --- The New Prompt-Handling Logic ---
        await navigator.clipboard.writeText(response.prompt)
        isCopyingPrompt.value = true
        setTimeout(() => {
          isCopyingPrompt.value = false
        }, COPY_CONFIRMATION_DURATION)
      } else {
        // --- The Default Context-Copying Logic ---
        await onCopyContext()
      }
    }
    loomRef.value?.clear()
  } catch (error) {
    console.error("error during commit", error)
  } finally {
    isCommitting.value = false
    setMode("normal")
  }
}

// only commit confirmation. mb expand as a mode with options like
// how to proceed next on enter, what to show on screen etc.
function enterConfirmationMode() {
  if (loomRef.value?.getWrappedContent()?.trim()) {
    setMode("confirmation")
    document.activeElement?.blur()
  }
}

const normalModeShortcuts = {
  o: () => {
    setMode("input")
    loomRef.value?.focus()
  },
  g: selectNextWave,
  i: selectPreviousWave,
  h: enterConfirmationMode,
  r: onCommitFromClipboard,
  y: onCopyWaveContent,
  q: onCopyContext,
}

const inputModeShortcuts = {
  Escape: () => {
    setMode("normal")
    document.activeElement?.blur()
  },
}

const confirmationModeShortcuts = {
  Enter: onCommit,
  Escape: () => setMode("normal"),
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

function onSetMode(newMode) {
  if (currentMode.value !== "confirmation") setMode(newMode)
}
async function onCommitFromClipboard() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (clipboardText && loomRef.value) {
      loomRef.value.setContent(clipboardText)
      enterConfirmationMode()
    }
  } catch (error) {
    console.error("failed to read clipboard", error)
  }
}
async function onCopyWaveContent() {
  if (focusedWave.value) {
    await navigator.clipboard.writeText(focusedWave.value.data)
    isCopyingWave.value = true
    setTimeout(() => {
      isCopyingWave.value = false
    }, COPY_CONFIRMATION_DURATION)
  }
}

async function onCopyContext() {
  let contextString = formatWaves(waves.value)

  // time sense
  if (waves.value.length > 0) {
    const lastWave = waves.value[waves.value.length - 1]
    const timeDifference = Date.now() - lastWave.timestamp

    const formattedTime = formatTime(timeDifference)
    const ephemeralBodyFragment = `\n\n${SOURCE_GLYPHS.OPEN}${SOURCES.BODY}\n[${formattedTime}]\n${SOURCE_GLYPHS.CLOSE}${SOURCES.BODY}`
    contextString += ephemeralBodyFragment
  }

  await navigator.clipboard.writeText(contextString)
  isCopyingContext.value = true
  setTimeout(() => {
    isCopyingContext.value = false
  }, COPY_CONFIRMATION_DURATION)
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
