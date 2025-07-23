// ~/pages/index.vue
<template>
  <div class="flex h-screen items-center justify-center bg-circles-gradient">
    <div class="h-[500px] w-[950px] flex flex-col gap-2">
      <!-- # manifest -->
      <div class="h-full flex" v-show="stance === 'manifest'">
        <div :style="{ width: `${LEFT_COLUMN_WIDTH}px` }"></div>
        <!-- ## loom -->
        <Loom
          ref="loomRef"
          class="flex-grow"
          v-if="currentHotkeysMode !== 'confirm'"
          :hotkyes-mode="currentHotkeysMode"
          @update-content="(content) => (loomContentCache = content)"
          @blur="onLoomBlur"
        />
        <div :style="{ width: `${RIGHT_COLUMN_WIDTH}px` }"></div>
      </div>

      <!-- # observe -->
      <div class="h-full flex" v-if="stance === 'observe'">
        <!-- ## spool -->
        <transition-group
          name="flow-list"
          tag="div"
          class="flex flex-col gap-5 py-6 flex-shrink-0"
          :style="{ width: `${LEFT_COLUMN_WIDTH}px` }"
        >
          <div
            v-for="fragment in displayFragments"
            :key="fragment._id"
            class="transition-all duration-[50ms] ease-in-out"
            :class="{
              'pl-[36px]': fragment._id !== selectedFragmentId,
            }"
            :style="
              currentHotkeysMode === 'confirm'
                ? { 'padding-left': `${LEFT_COLUMN_WIDTH - 8}px` }
                : {}
            "
          >
            <div class="rounded-l-xl overflow-hidden ring-[6px] ring-moss-350">
              <img
                :src="sourceImgMap[fragment.source]"
                class="h-auto max-w-none"
                :style="{ width: `${LEFT_COLUMN_WIDTH}px` }"
              />
            </div>
          </div>
        </transition-group>
        <!-- ## screen -->
        <div class="flex-grow p-2 bg-moss-350 rounded-xl overflow-hidden">
          <div class="overflow-hidden h-full">
            <div
              class="h-full bg-moss-400 text-stone-300 rounded-lg py-5 px-8 font-fira-code overflow-y-auto overflow-x-hidden whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
            >
              {{ screenContent }}
            </div>
          </div>
        </div>
        <div
          class="flex-shrink-0"
          :style="{ width: `${RIGHT_COLUMN_WIDTH}px` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import gukiImg from "~/assets/guki.jpg"
import roxanneImg from "~/assets/roxanne.jpg"
import bodyImg from "~/assets/body.jpg"
import externalImg from "~/assets/external.jpg"
import { SOURCE_GLYPHS, SOURCES, AUDIO_GLYPH } from "~/lexicon"
import { vocalScheduler } from "~/utils/VocalScheduler"

const LOOM_LOCAL_STORAGE_KEY = "stone-loom"
const LAST_SPOKEN_WAVE_ID_KEY = "stone-last-spoken-wave-id"
const COPY_CONFIRMATION_DURATION = 1000
const LEFT_COLUMN_WIDTH = 100
const RIGHT_COLUMN_WIDTH = 80

const { currentHotkeysMode, setHotkeysMode, setHotkeysShortcuts } = useHotkeys()

const loomRef = ref(null)
const waves = ref([])
const selectedFragmentId = ref(null)
const isCommitting = ref(false)
const isCopyingRawFragment = ref(false)
const isCopyingLastTwo = ref(false)
const isCopyingFullContext = ref(false)
const isCopyingPrompt = ref(false)
const isContentToCommitEmpty = ref(false)

const stance = ref("observe") // observe or manifest

const loomContentCache = ref("")

let cleanupHotkeysShortcuts
let commitInitiator
let commitContent

const shortcuts = {
  normal: {
    o: () => setStance("manifest"),
    g: selectNextFragment,
    i: selectPreviousFragment,
    h: () => enterConfirmMode({ initiator: "loom" }),
    r: () => enterConfirmMode({ initiator: "clipboard" }),
    y: copyFragmentRawData,
    c: copyLastTwoFragments,
    q: () => copyFragmentsByWaves(waves.value, isCopyingFullContext),
    t: () => {
      localStorage.setItem(LAST_SPOKEN_WAVE_ID_KEY, "")
      fetchFlow()
    },
  },
  input: {
    Escape: () => setStance("observe"),
  },
  confirm: {
    Enter: commitWrapper,
    Escape: () => setHotkeysMode("normal"),
  },
}

const sourceImgMap = {
  guki: gukiImg,
  roxanne: roxanneImg,
  body: bodyImg,
  external: externalImg,
}

const displayFragments = computed(() => {
  if (!waves.value.length) return []

  const fragments = []

  let currentFragment = null

  waves.value.forEach((fragment) => {
    if (currentFragment && currentFragment.source === fragment.source) {
      // If source is the same, merge the data
      currentFragment.data += "\n\n" + fragment.data
      currentFragment.waveIds.push(fragment._id)
    } else {
      // if source has changed, push the previous fragment and start a new one
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
  return fragments.slice(-5)
})

const focusedFragment = computed(() => {
  if (!selectedFragmentId.value) return null
  return displayFragments.value.find((w) => w._id === selectedFragmentId.value)
})

const screenContent = computed(() => {
  if (isCopyingLastTwo.value) return "[LAST TWO FRAGMENTS COPIED]"
  if (isContentToCommitEmpty.value) return "[CONTENT TO COMMIT IS EMPTY]"
  if (isCopyingPrompt.value) return "[PROMPT COPIED TO CLIPBOARD]"
  if (isCopyingFullContext.value) return "[FULL CONTEXT COPIED TO CLIPBOARD]"
  if (isCopyingRawFragment.value) return "[RAW FRAGMENT COPIED TO CLIPBOARD]"
  if (isCommitting.value) return "[COMMITTING...]"
  if (currentHotkeysMode.value === "confirm") {
    return `[CONFIRM COMMIT] [INITIATOR: ${commitInitiator}]\n\n${commitContent}`
  }
  return focusedFragment.value ? focusedFragment.value.data : ""
})

// --- Lifecycle & Data ---
onMounted(() => {
  cleanupHotkeysShortcuts = setHotkeysShortcuts({
    normal: shortcuts.normal,
    input: shortcuts.input,
    confirm: shortcuts.confirm,
  })
  fetchFlow()
  // initiate loom
  setHotkeysMode("input")
  nextTick(() => {
    setHotkeysMode("normal")
  })
})

onUnmounted(() => {
  if (cleanupHotkeysShortcuts) {
    cleanupHotkeysShortcuts()
  }
})

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
  await updateCommitContent({ initiator: commitInitiator })
  if (isCommitting.value || !commitContent) return

  isCommitting.value = true
  try {
    const response = await commit(commitContent)

    if (response.success) {
      await fetchFlow()

      if (response.archivePayload) {
        const now = new Date()
        const timestamp = now.toISOString().replace(/[:.]/g, "-")
        const fileName = `stone-archive-${timestamp}.json`
        fileSave(fileName, response.archivePayload)
      }

      if (response.prompt) {
        await navigator.clipboard.writeText(response.prompt)
        isCopyingPrompt.value = true
        setTimeout(() => {
          isCopyingPrompt.value = false
        }, COPY_CONFIRMATION_DURATION)
      } else {
        await copyLastTwoFragments()
      }

      if (commitInitiator === "loom") {
        clearLoom()
      }
    }
  } catch (error) {
    console.error("error during commit", error)
  } finally {
    isCommitting.value = false
    setHotkeysMode("normal")
  }
}

function clearLoom() {
  loomContentCache.value = ""
  localStorage.setItem(LOOM_LOCAL_STORAGE_KEY, "")
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

async function updateCommitContent({ initiator }) {
  if (initiator === "clipboard") {
    const clipboardContent = await navigator.clipboard.readText()
    if (!clipboardContent) return ""

    let lines = clipboardContent.split("\n")

    // step 1 is prepend opening glyph if missing
    if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
      lines.unshift(`${SOURCE_GLYPHS.OPEN}${SOURCES.ROXANNE}`)
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
    commitContent = lines.join("\n")
  } else if (initiator === "loom") {
    commitContent = loomContentCache.value.trim()
  } else {
    console.error("updateCommitContent: unknown initiator")
  }
}

// only commit confirm. mb expand as a mode with options like
// how to proceed next on enter, what to show on screen etc.
async function enterConfirmMode({ initiator }) {
  await updateCommitContent({ initiator })
  if (commitContent) {
    setHotkeysMode("confirm")
    commitInitiator = initiator
  } else {
    if (isContentToCommitEmpty.value) return
    isContentToCommitEmpty.value = true
    setTimeout(() => {
      isContentToCommitEmpty.value = false
    }, COPY_CONFIRMATION_DURATION)
  }
}

async function fetchFlow() {
  const { success, waves: fetchedWaves } = await getFlow()
  if (success) {
    waves.value = fetchedWaves
    const currentFragments = displayFragments.value
    if (currentFragments.length > 0) {
      selectedFragmentId.value =
        currentFragments[currentFragments.length - 1]._id
    }
    speakLatestRoxanneWave()
  } else {
    console.error("failed to fetch flow")
  }
}

function speakLatestRoxanneWave() {
  const lastSpokenId = localStorage.getItem(LAST_SPOKEN_WAVE_ID_KEY)
  const reversedWaves = [...waves.value].reverse()

  for (const wave of reversedWaves) {
    if (wave.source !== SOURCES.ROXANNE) continue
    if (!wave.data.includes(AUDIO_GLYPH)) continue

    //〔 we found the most recent wave with audio.
    if (wave._id !== lastSpokenId) {
      localStorage.setItem(LAST_SPOKEN_WAVE_ID_KEY, wave._id)

      const lines = wave.data.split("\n")

      //〔 each audio line is now its own, independent job.
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith(AUDIO_GLYPH)) {
          const audioText = trimmedLine.substring(AUDIO_GLYPH.length).trim()
          if (audioText) {
            //〔 we add each line directly to the scheduler. no more joining or splitting.
            vocalScheduler.add({ text: audioText, provider: "openai" })
          }
        }
      }
    }

    //〔 most recent audio wave found and scheduled. our work is done.
    break
  }
}

function onLoomBlur() {
  setHotkeysMode("normal")
  setStance("observe")
}

async function copyFragmentRawData() {
  if (focusedFragment.value) {
    await navigator.clipboard.writeText(focusedFragment.value.data)
    isCopyingRawFragment.value = true
    setTimeout(() => {
      isCopyingRawFragment.value = false
    }, COPY_CONFIRMATION_DURATION)
  }
}

async function copyLastTwoFragments() {
  const fragmentsToCopy = displayFragments.value.slice(-2)
  if (fragmentsToCopy.length === 0) return

  const waveIdsToFind = fragmentsToCopy.flatMap((fragment) => fragment.waveIds)
  if (waveIdsToFind.length === 0) return

  const wavesToCopy = waves.value.filter((wave) =>
    waveIdsToFind.includes(wave._id)
  )

  copyFragmentsByWaves(wavesToCopy, isCopyingLastTwo)
}

async function copyFragmentsByWaves(wavesToCopy, isCopying) {
  let contextString = formatWaves(wavesToCopy)

  // time sense
  if (wavesToCopy.length > 0) {
    const lastWave = wavesToCopy[wavesToCopy.length - 1]
    const timeDifference = Date.now() - lastWave.timestamp

    const formattedTime = formatTime(timeDifference)
    const ephemeralBodyFragment = `\n\n${SOURCE_GLYPHS.OPEN}${SOURCES.BODY}\n〄 ${formattedTime}\n${SOURCE_GLYPHS.CLOSE}${SOURCES.BODY}`
    contextString += ephemeralBodyFragment
  }

  await navigator.clipboard.writeText(contextString)
  isCopying.value = true
  setTimeout(() => {
    isCopying.value = false
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
  transform: translateY(-10px);
}
.flow-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.flow-list-leave-active {
  position: absolute;
}
</style>
