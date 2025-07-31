// ☷ ~/continents/sentis.vue
<template>
  <div
    class="flex h-screen items-center justify-center pb-20 bg-circles-gradient"
  >
    <div class="h-[500px] w-[950px] flex flex-col gap-2">
      <!-- # manifest -->
      <div class="h-full flex" v-show="stance === 'manifest'">
        <div :style="{ width: `${LEFT_COLUMN_WIDTH}px` }"></div>
        <div
          class="h-full flex-shrink-0 rounded-xl overflow-hidden bg-coffee-650 p-2 flex-grow flex flex-col"
        >
          <!-- ## status -->
          <div
            class="flex flex-shrink-0 h-[50px] font-pacifico text-coffee-400 px-14 text-3xl cursor-default"
          >
            {{ screen.status || "" }}
          </div>
          <!-- ## loom -->
          <Loom
            ref="loomRef"
            v-if="currentHotkeysMode !== 'confirm'"
            :hotkyes-mode="currentHotkeysMode"
            @update-content="(content) => (loomWrappedContentCache = content)"
            @blur="onLoomBlur"
          />
        </div>
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
              'pl-[42px]':
                currentHotkeysMode === 'confirm' ||
                fragment._id !== selectedFragmentId,
            }"
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
        <div
          class="flex-grow p-2 bg-moss-350 rounded-xl overflow-hidden flex flex-col z-10"
        >
          <!-- ## status -->
          <div
            class="flex h-[50px] font-pacifico text-moss-200 px-14 text-3xl cursor-default flex-shrink-0"
          >
            {{ screen.status || "" }}
          </div>
          <!-- ## screen -->
          <div class="overflow-hidden rounded-lg h-full" @click="onScreenClick">
            <div class="overflow-hidden rounded-lg h-full">
              <!-- ### scribe mode -->
              <div
                v-if="screenMode === 'scribe'"
                class="h-full bg-moss-400 text-moss-100 rounded-lg py-5 font-fira overflow-y-auto overflow-x-hidden whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg leading-8"
                v-html="parsedScreen.html"
              ></div>
              <!-- ### plain mode -->
              <div
                v-else
                class="h-full bg-moss-400 text-moss-100 rounded-lg py-5 px-8 font-fira overflow-y-auto overflow-x-hidden whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg leading-8"
              >
                {{ screen.content || "" }}
              </div>
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
import soundStartRecording from "~/assets/sound/startRecording.mp3"
import soundStopRecording from "~/assets/sound/stopRecording.mp3"
import soundCommit from "~/assets/sound/commit.mp3"
import gukiImg from "~/assets/guki.jpg"
import roxanneImg from "~/assets/roxanne.jpg"
import bodyImg from "~/assets/body.jpg"
import externalImg from "~/assets/external.jpg"
import { SOURCE_GLYPHS, SOURCES, AUDIO_GLYPH } from "~/lexicon"
import { vocalScheduler } from "~/utils/VocalScheduler"
import scribe from "~/utils/scribe"
import { useAudioRecorder } from "~/composables/useAudioRecorder"
import useDB from "~/composables/useDatabase"

const LOOM_LOCAL_STORAGE_KEY = "stone-loom"
const LAST_SPOKEN_WAVE_ID_KEY = "stone-last-spoken-wave-id"
const MIGRATION_JOB_KEY = "stone-migration-job"
const COPY_CONFIRMATION_DURATION = 1000
const LEFT_COLUMN_WIDTH = 100
const RIGHT_COLUMN_WIDTH = 70

const { currentHotkeysMode, setHotkeysMode, setHotkeysShortcuts } = useHotkeys()
const { isRecording, startRecording, stopRecording } = useAudioRecorder()
const { savePendingAudio, getPendingAudio, clearPendingAudio } = useLocalAudio()
const { events: oldEvents, appState: oldAppState } = useDB()

const loomRef = ref(null)
const waves = ref([])
const selectedFragmentId = ref(null)
const isCommitting = ref(false)
const isFetchingFlow = ref(false)
const isCopyingRawFragment = ref(false)
const isCopyingLastTwo = ref(false)
const isCopyingFullContext = ref(false)
const isCopyingPrompt = ref(false)
const isContentToCommitEmpty = ref(false)
const isForging = ref(false)
const isDensifying = ref(false)
const isCopyingCode = ref(false)
const rawCodeBlocks = ref([])
const hasPendingRecording = ref(false)
const isTranscribing = ref(false)

const stance = ref("observe") // ❖ observe, manifest
const loomWrappedContentCache = ref("")
let cleanupHotkeysShortcuts
const commitInitiator = ref("")
const commitContent = ref("")
const commitWithForge = ref(false)
const screenMode = ref("scribe") // ❖ scribe, plain
const forgeStatus = ref("forge")
const densifyStatus = ref("densify")

const commitStatus = computed(() => {
  let status = `commit ${commitInitiator.value}`
  if (commitWithForge.value) status += " with forge"
  return status
})
const currentConfirmJob = ref("commit") // ❖ commit, forge
const confirmJob = {
  commit: {
    enter: async () => {
      await commitWrapper()
      setHotkeysMode("normal")
    },
    status: commitStatus,
    screen: commitContent,
  },
  forge: {
    enter: async () => {
      await onForge()
      setHotkeysMode("normal")
    },
    status: forgeStatus,
  },
  densify: {
    enter: async () => {
      await onDensify()
      setHotkeysMode("normal")
    },
    status: densifyStatus,
  },
}

const shortcuts = {
  normal: {
    // ❖ left hand
    o: () => setStance("manifest"),
    e: toggleScreenMode,
    b: copyFragmentRawData,
    c: copyLastTwoFragments,
    q: () => copyFragmentsByWaves(waves.value, isCopyingFullContext),
    g: selectNextFragment,
    i: selectPreviousFragment,

    // ❖ right hand
    r: () => {
      enterConfirmCommitMode({ initiator: "clipboard", withForge: false })
    },
    f: () => {
      localStorage.setItem(LAST_SPOKEN_WAVE_ID_KEY, "")
      fetchFlow()
    },
    h: () => enterConfirmCommitMode({ initiator: "loom", withForge: true }),
    s: enterConfirmDensifyMode,
    d: onRetryTranscription,
    m: () => enterConfirmCommitMode({ initiator: "loom", withForge: false }),
    l: enterConfirmForgeMode,
    k: onInitiateMigration,

    // ❖ stick
    // F2: () => {}, // smth
    F4: onToggleRecording,
    y: justTalk,
  },
  input: {
    // ❖ left hand
    Escape: () => setStance("observe"),

    // ❖ stick
    F4: onToggleRecording,
  },
  confirm: {
    Enter: () => confirmJob[currentConfirmJob.value].enter(),
    Escape: () => setHotkeysMode("normal"),
    e: toggleScreenMode,
  },
}

async function onInitiateMigration() {
  const MIGRATION_TOKEN_LIMIT = 4000
  const migrationJobRaw = localStorage.getItem(MIGRATION_JOB_KEY)

  if (!migrationJobRaw) {
    // --- Phase 1: The Forging ---
    const eventName = window.prompt("Enter the name of the event to excavate:")
    if (!eventName) return

    const eventToMigrate = oldEvents.find((e) => e.name === eventName)
    if (!eventToMigrate) {
      alert("Event not found in the old archive.")
      return
    }

    const chunks = eventToMigrate.text.split("\n\n")
    const parts = []
    let currentPartText = ""

    for (const chunk of chunks) {
      if (
        currentPartText.length + chunk.length > MIGRATION_TOKEN_LIMIT &&
        currentPartText
      ) {
        parts.push({ text: currentPartText.trim(), consumed: false })
        currentPartText = chunk
      } else {
        currentPartText += (currentPartText ? "\n\n" : "") + chunk
      }
    }
    if (currentPartText) {
      parts.push({ text: currentPartText.trim(), consumed: false })
    }

    const totalParts = parts.length
    const formattedParts = parts.map((part, index) => {
      const header = `${eventToMigrate.name} (${eventToMigrate.date}) - Part ${
        index + 1
      }/${totalParts}`
      return {
        text: `${header}\n\n${part.text}`,
        consumed: false,
      }
    })

    localStorage.setItem(MIGRATION_JOB_KEY, JSON.stringify(formattedParts))
    alert(`Migration job forged for "${eventName}" with ${totalParts} parts.`)
  } else {
    // --- Phase 2: The Unearthing ---
    const migrationJob = JSON.parse(migrationJobRaw)
    const nextPartIndex = migrationJob.findIndex((part) => !part.consumed)

    if (nextPartIndex === -1) {
      localStorage.removeItem(MIGRATION_JOB_KEY)
      alert("This migration is complete. The job has been cleared.")
      return
    }

    const savedContent = localStorage.getItem(LOOM_LOCAL_STORAGE_KEY)
    const contentToLoad = migrationJob[nextPartIndex].text
    const newLoomContent = `${savedContent}\n\n\`\`\`\n${contentToLoad}\n\`\`\``
    loomWrappedContentCache.value = newLoomContent
    loomRef.value?.updateContent(newLoomContent)

    migrationJob[nextPartIndex].consumed = true
    localStorage.setItem(MIGRATION_JOB_KEY, JSON.stringify(migrationJob))

    if (nextPartIndex === migrationJob.length - 1) {
      localStorage.removeItem(MIGRATION_JOB_KEY)
      alert(
        `Final part unearthed for "${
          migrationJob[0].text.split(" ")[0]
        }". Migration complete.`
      )
    }
  }
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
      currentFragment.data += "\n\n" + fragment.data
      currentFragment.waveIds.push(fragment._id)
    } else {
      if (currentFragment) fragments.push(currentFragment)
      currentFragment = {
        _id: fragment._id,
        source: fragment.source,
        data: fragment.data,
        waveIds: [fragment._id],
      }
    }
  })
  if (currentFragment) fragments.push(currentFragment)
  return fragments.slice(-5)
})

const focusedFragment = computed(() => {
  if (!selectedFragmentId.value) return null
  return displayFragments.value.find((w) => w._id === selectedFragmentId.value)
})

const screen = computed(() => {
  let status, content
  if (currentHotkeysMode.value === "input") status = "loom"
  else if (currentHotkeysMode.value === "confirm") {
    status = confirmJob[currentConfirmJob.value].status?.value || ""
    content = confirmJob[currentConfirmJob.value].screen?.value || ""
  } else if (focusedFragment.value) {
    status = "fragment"
    content = focusedFragment.value.data
  }
  if (isCopyingCode.value) status = "code copied to clipboard"
  if (isCopyingLastTwo.value) status = "last two fragments copied"
  if (isContentToCommitEmpty.value) status = "content to commit is empty"
  if (isCopyingPrompt.value) status = "prompt copied to clipboard"
  if (isCopyingFullContext.value) status = "full context copied to clipboard"
  if (isCopyingRawFragment.value) status = "raw fragment copied to clipboard"
  if (isFetchingFlow.value) status = "fetching flow..."
  if (isCommitting.value) status = "committing..."
  if (isRecording.value) status = "recording..."
  if (hasPendingRecording.value) status = "pending audio..."
  if (isTranscribing.value) status = "transcribing..."

  return { status, content }
})

const parsedScreen = computed(() => {
  if (!screen.value.content) return { html: "", rawCodeBlocks: [] }
  const result = scribe(screen.value.content)
  rawCodeBlocks.value = result.rawCodeBlocks
  return result
})

onMounted(async () => {
  cleanupHotkeysShortcuts = setHotkeysShortcuts({
    normal: shortcuts.normal,
    input: shortcuts.input,
    confirm: shortcuts.confirm,
  })
  await oldEvents.loadFromDB()
  await oldAppState.loadFromDB()
  await fetchFlow()
  const pendingAudio = await getPendingAudio()
  if (pendingAudio) hasPendingRecording.value = true
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
// --- Transcription Logic ---
async function onToggleRecording() {
  if (isRecording.value) {
    playSound(soundStopRecording)
    const audioBlob = await stopRecording()
    if (audioBlob) {
      await savePendingAudio(audioBlob)
      hasPendingRecording.value = true
      await transcribeAndUpdateLoom()
    }
  } else {
    if (hasPendingRecording.value) return //〔 prevent recording if there's pending audio.
    playSound(soundStartRecording)
    await startRecording()
  }
}

async function onRetryTranscription() {
  if (hasPendingRecording.value && !isTranscribing.value) {
    await transcribeAndUpdateLoom()
  }
}

async function transcribeAndUpdateLoom() {
  if (isTranscribing.value) return
  isTranscribing.value = true
  try {
    const audioBlob = await getPendingAudio()
    if (!audioBlob) {
      hasPendingRecording.value = false
      return
    }

    const { success, transcription } = await transcribe(audioBlob)

    if (success && transcription) {
      const savedContent = localStorage.getItem(LOOM_LOCAL_STORAGE_KEY)
      const newLoomContent = `${savedContent}\n\n${AUDIO_GLYPH} ${transcription}`
      loomWrappedContentCache.value = newLoomContent
      loomRef.value?.updateContent(newLoomContent) //〔 a new method for loom.
      await clearPendingAudio()
      hasPendingRecording.value = false
    }
  } catch (error) {
    console.error("transcription failed:", error)
  } finally {
    isTranscribing.value = false
  }
}

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
  playSound(soundCommit)
  await updateCommitContent({ initiator: commitInitiator.value })
  if (isCommitting.value || !commitContent.value) return

  isCommitting.value = true
  try {
    const response = await commit(commitContent.value)

    if (response.success) {
      isCommitting.value = false
      if (commitWithForge.value) {
        await fetchFlow()
        currentConfirmJob.value = "forge"
        await onForge()
      } else {
        await fetchFlow()
      }

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
      } else if (!commitWithForge.value) {
        await copyLastTwoFragments()
      }

      if (commitInitiator.value === "loom") {
        clearLoom()
      }
    }
  } catch (error) {
    console.error("error during commit", error)
  } finally {
    isCommitting.value = false
  }
}

function clearLoom() {
  loomWrappedContentCache.value = ""
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
    if (!lines[0]?.startsWith(SOURCE_GLYPHS.OPEN)) {
      lines.unshift(`${SOURCE_GLYPHS.OPEN}${SOURCES.ROXANNE}`)
    }
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
    commitContent.value = lines.join("\n")
  } else if (initiator === "loom") {
    commitContent.value = loomWrappedContentCache.value.trim()
  } else {
    console.error("updateCommitContent: unknown initiator")
  }
}

// only commit confirm. mb expand as a mode with options like
// how to proceed next on enter, what to show on screen etc.
async function enterConfirmCommitMode({ initiator, withForge }) {
  currentConfirmJob.value = "commit"
  await updateCommitContent({ initiator })
  if (commitContent.value) {
    setHotkeysMode("confirm")
    commitInitiator.value = initiator
    commitWithForge.value = withForge
  } else {
    if (isContentToCommitEmpty.value) return
    isContentToCommitEmpty.value = true
    setTimeout(() => {
      isContentToCommitEmpty.value = false
    }, COPY_CONFIRMATION_DURATION)
  }
}
async function enterConfirmForgeMode() {
  currentConfirmJob.value = "forge"
  setHotkeysMode("confirm")
}

async function enterConfirmDensifyMode() {
  currentConfirmJob.value = "densify"
  setHotkeysMode("confirm")
}

async function fetchFlow() {
  isFetchingFlow.value = true
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
  isFetchingFlow.value = false
}

function speakLatestRoxanneWave() {
  const lastSpokenId = localStorage.getItem(LAST_SPOKEN_WAVE_ID_KEY)
  const reversedWaves = [...waves.value].reverse()

  for (const wave of reversedWaves) {
    if (wave.source !== SOURCES.ROXANNE || !wave.data.includes(AUDIO_GLYPH))
      continue

    if (wave._id !== lastSpokenId) {
      localStorage.setItem(LAST_SPOKEN_WAVE_ID_KEY, wave._id)

      const audioLines = []
      const lines = wave.data.split("\n")
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith(AUDIO_GLYPH)) {
          const audioText = trimmedLine.substring(AUDIO_GLYPH.length).trim()
          if (audioText) audioLines.push(audioText)
        }
      }

      if (audioLines.length > 0) {
        ;(async () => {
          for (const text of audioLines) {
            vocalScheduler.add({ text, provider: "speechify" })
            await new Promise((resolve) => setTimeout(resolve, 1_000))
          }
        })()
      }
    }
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

async function onDensify() {
  if (isDensifying.value) return

  isDensifying.value = true
  densifyStatus.value = "densifying..."

  try {
    await densify({
      onStatus: (status) => {
        densifyStatus.value = status
      },
    })
    await fetchFlow()
  } catch (error) {
    console.error("error during densify", error)
  } finally {
    isDensifying.value = false
    densifyStatus.value = "densify"
  }
}

async function onForge() {
  if (isForging.value) return

  isForging.value = true
  forgeStatus.value = "forging..."

  try {
    const prompt = formatContextForForge()
    await forge({
      prompt,
      onStatus: (status) => {
        forgeStatus.value = status
      },
    })
    await fetchFlow()
  } catch (error) {
    console.error("error during forge", error)
  } finally {
    isForging.value = false
    forgeStatus.value = "forge"
  }
}

function formatContextForForge() {
  let contextString = formatWaves(waves.value)
  const lastWave = waves.value[waves.value.length - 1]
  const timeDifference = Date.now() - lastWave.timestamp
  const formattedTime = formatTime(timeDifference)
  const ephemeralBodyFragment = `\n\n${SOURCE_GLYPHS.OPEN}${SOURCES.BODY}\n〄 ${formattedTime}\n${SOURCE_GLYPHS.CLOSE}${SOURCES.BODY}`
  contextString += ephemeralBodyFragment
  return contextString
}

async function copyFragmentsByWaves(wavesToCopy, isCopying) {
  let contextString = formatWaves(wavesToCopy)

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

function toggleScreenMode() {
  if (screenMode.value === "scribe") {
    screenMode.value = "plain"
  } else {
    screenMode.value = "scribe"
  }
}

async function onScreenClick(event) {
  if (isCopyingCode.value) return

  if (event.target.classList.contains("scribe-copy-button")) {
    const codeBlockEl = event.target.closest(".scribe-code-block")
    if (codeBlockEl) {
      const blockId = codeBlockEl.dataset.codeBlockId
      const codeToCopy = rawCodeBlocks.value[blockId]
      if (codeToCopy) {
        await navigator.clipboard.writeText(codeToCopy)
        isCopyingCode.value = true

        const buttonEl = event.target
        buttonEl.classList.remove("scribe-copy-button")
        buttonEl.classList.add("scribe-copy-button--pending")

        setTimeout(() => {
          isCopyingCode.value = false
          if (buttonEl) {
            buttonEl.classList.remove("scribe-copy-button--pending")
            buttonEl.classList.add("scribe-copy-button")
          }
        }, COPY_CONFIRMATION_DURATION)
      }
    }
  }
}
async function justTalk() {
  // ✎ brutal force quick solution
  if (!isRecording.value) {
    onToggleRecording()
  } else {
    await onToggleRecording()
    await enterConfirmCommitMode({ initiator: "loom", withForge: true })
    confirmJob[currentConfirmJob.value].enter()
  }
}
function playSound(sound) {
  const audio = new Audio(sound)
  audio.play()
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
