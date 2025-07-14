// ~/pages/index.vue
<template>
  <div class="flex h-screen items-center justify-center bg-circles-gradient">
    <div class="h-[500px] w-[900px] flex flex-col gap-2">
      <!-- # manifest -->
      <div v-show="stance === 'manifest'">
        <!-- ## loom -->
        <Loom
          ref="loomRef"
          v-show="currentHotkeysMode !== 'confirm'"
          :hotkyes-mode="currentHotkeysMode"
          @update-content="(content) => (loomContentCache = content)"
          @on-loom-blur="onLoomBlur"
        />
      </div>

      <!-- # observe -->
      <div class="flex" v-show="stance === 'observe'">
        <!-- ## spool -->
        <transition-group
          name="flow-list"
          tag="div"
          class="flex flex-col gap-2 w-[200px]"
        >
          <div
            v-for="fragment in displayFragments"
            :key="fragment._id"
            class="h-[65px] flex rounded-xl gap-[6px]"
          >
            <div
              v-if="fragment._id === selectedFragmentId"
              class="bg-carrot-500 my-1 w-[10px] rounded-md"
            ></div>
            <div
              class="px-4 py-2 w-full rounded-xl cursor-default"
              :class="{
                'bg-coffee-500 selection-paper': fragment.source === 'guki',
                'bg-moss-350 selection-screen': fragment.source === 'roxanne',
                'bg-coffee-700 selection-paper':
                  fragment.source !== 'guki' && fragment.source !== 'roxanne',
              }"
            >
              <p
                class="line-clamp-2"
                :class="{
                  'text-coffee-850 text-lg leading-[22px]':
                    fragment.source === 'guki',
                  'text-moss-100 font-fira-code': fragment.source !== 'guki',
                }"
              >
                {{ fragment.data }}
              </p>
            </div>
          </div>
        </transition-group>
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
    </div>
  </div>
</template>

<script setup>
import gukiImg from "~/assets/guki.jpg"
import roxanneImg from "~/assets/roxanne.jpg"
import bodyImg from "~/assets/body.jpg"
import externalImg from "~/assets/external.jpg"
import { SOURCE_GLYPHS, SOURCES } from "~/lexicon"

const LOOM_LOCAL_STORAGE_KEY = "stone-loom"
const COPY_CONFIRMATION_DURATION = 1000

const { currentHotkeysMode, setHotkeysMode, setHotkeysShortcuts } = useHotkeys()

const loomRef = ref(null)
const waves = ref([])
const selectedFragmentId = ref(null)
const isCommitting = ref(false)
const isCopyingFragment = ref(false)
const isCopyingContext = ref(false)
const isCopyingPrompt = ref(false)

const stance = ref("observe") // observe or manifest

const loomContentCache = ref("")

let cleanupHotkeysShortcuts

const shortcuts = {
  normal: {
    o: () => setStance("manifest"),
    g: selectNextFragment,
    i: selectPreviousFragment,
    h: enterConfirmMode,
    r: commitFromClipboard,
    y: copyFragment,
    q: copyContext,
  },
  input: {
    Escape: () => setStance("observe"),
  },
  confirm: {
    Enter: commitWrapper,
    Escape: () => setHotkeysMode("normal"),
  },
}

const displayFragments = computed(() => {
  if (!waves.value.length) return []

  const fragments = []
  // We work with a non-reversed copy to process chronologically
  const chronologicalWaves = [...waves.value]

  let currentFragment = null

  chronologicalWaves.forEach((fragment) => {
    if (currentFragment && currentFragment.source === fragment.source) {
      // If source is the same, merge the data
      currentFragment.data += "\n" + fragment.data
      currentFragment.waveIds.push(fragment._id)
    } else {
      // If source has changed, push the previous fragment and start a new one
      if (currentFragment) {
        fragments.push(currentFragment)
      }
      currentFragment = {
        // We use the last fragment's id as the key for the fragment
        _id: fragment._id,
        source: fragment.source,
        data: fragment.data,
        waveIds: [fragment._id], // Keep track of the original waves
      }
    }
  })
  // Push the very last fragment after the loop
  if (currentFragment) {
    fragments.push(currentFragment)
  }
  return fragments.slice(-9).reverse()
})

const focusedFragment = computed(() => {
  if (!selectedFragmentId.value) return null
  return displayFragments.value.find((w) => w._id === selectedFragmentId.value)
})

const screenContent = computed(() => {
  if (isCopyingPrompt.value) return "[PROMPT COPIED TO CLIPBOARD]"
  if (isCopyingContext.value) return "[CONTEXT COPIED TO CLIPBOARD]"
  if (isCopyingFragment.value) return "[FRAGMENT COPIED TO CLIPBOARD]"
  if (isCommitting.value) return "[COMMITTING...]"
  if (currentHotkeysMode.value === "confirm") {
    const loomContent = loomContentCache.value.trim() || ""
    return `[CONFIRM COMMIT]\n\n${loomContent}`
  }
  return focusedFragment.value
    ? `[${focusedFragment.value.source}]\n\n${focusedFragment.value.data}`
    : ""
})

// --- Lifecycle & Data ---
onMounted(() => {
  const localLoomContent = localStorage.getItem(LOOM_LOCAL_STORAGE_KEY)
  if (localLoomContent) loomContentCache.value = localLoomContent
  cleanupHotkeysShortcuts = setHotkeysShortcuts({
    normal: shortcuts.normal,
    input: shortcuts.input,
    confirm: shortcuts.confirm,
  })
  fetchFlow()
})

onUnmounted(() => {
  if (cleanupHotkeysShortcuts) {
    cleanupHotkeysShortcuts()
  }
})

// --- Hotkey & Mode Logic ---
function selectNextFragment() {
  const currentFragments = displayFragments.value
  if (currentFragments.length === 0) return
  const currentIndex = currentFragments.findIndex(
    (w) => w._id === selectedFragmentId.value
  )
  if (currentIndex === -1 || currentIndex === currentFragments.length - 1) {
    selectedFragmentId.value = currentFragments[0]._id
  } else {
    selectedFragmentId.value = currentFragments[currentIndex + 1]._id
  }
}

function selectPreviousFragment() {
  const currentFragments = displayFragments.value
  if (currentFragments.length === 0) return
  const currentIndex = currentFragments.findIndex(
    (w) => w._id === selectedFragmentId.value
  )
  if (currentIndex <= 0) {
    selectedFragmentId.value = currentFragments[currentFragments.length - 1]._id
  } else {
    selectedFragmentId.value = currentFragments[currentIndex - 1]._id
  }
}

async function commitWrapper() {
  if (isCommitting.value || !loomContentCache.value.trim()) return

  isCommitting.value = true
  try {
    // commit function returns a unified response object
    const response = await commit(loomContentCache.value.trim())

    if (response.success) {
      await fetchFlow() // always fetch the new flow first

      if (response.prompt) {
        await navigator.clipboard.writeText(response.prompt)
        isCopyingPrompt.value = true
        setTimeout(() => {
          isCopyingPrompt.value = false
        }, COPY_CONFIRMATION_DURATION)
      } else {
        await copyContext()
      }
    }
    loomRef.value?.clear()
  } catch (error) {
    console.error("error during commit", error)
  } finally {
    isCommitting.value = false
    setHotkeysMode("normal")
  }
}

function setStance(newStance) {
  if (newStance === "manifest") {
    stance.value = "manifest"
    setHotkeysMode("input")
    nextTick(() => {
      loomRef.value?.focus()
    })
  } else {
    setHotkeysMode("normal")
    stance.value = "observe"
  }
}

// only commit confirm. mb expand as a mode with options like
// how to proceed next on enter, what to show on screen etc.
function enterConfirmMode() {
  if (loomContentCache.value.trim()) {
    setHotkeysMode("confirm")
  }
}

async function fetchFlow() {
  const { success, waves: fetchedWaves } = await getFlow()
  if (success) {
    waves.value = fetchedWaves
    if (displayFragments.value.length > 0) {
      selectedFragmentId.value = displayFragments.value[0]._id
    }
  } else {
    console.error("failed to fetch flow")
  }
}

function onLoomBlur() {
  setHotkeysMode("normal")
  setStance("observe")
}
async function commitFromClipboard() {
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (clipboardText && loomRef.value) {
      loomRef.value.setContent(clipboardText)
      enterConfirmMode()
    }
  } catch (error) {
    console.error("failed to read clipboard", error)
  }
}
async function copyFragment() {
  if (focusedFragment.value) {
    await navigator.clipboard.writeText(focusedFragment.value.data)
    isCopyingFragment.value = true
    setTimeout(() => {
      isCopyingFragment.value = false
    }, COPY_CONFIRMATION_DURATION)
  }
}

async function copyContext() {
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
