<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-4 p-1 pb-8">
    <!-- # mid ---------------------------------------------------------------->
    <div class="flex overflow-hidden justify-between gap-2 flex-grow">
      <div class="flex flex-col gap-2 w-[255px] flex-shrink-0">
        <Events
          :events="events"
          :focused-index="
            appState.focusedList === 'events' ? appState.focusedIndex : null
          "
          :selected="appState.selectedEvents || []"
          @new-event="newEvent"
          @toggle-focus="toggleEventFocus"
          @toggle-select="toggleEventSelect"
          @toggle-select-all="toggleSelectAllEvents"
        />
        <Files
          ref="filesRef"
          v-if="files"
          :files="files"
          :path="appState.filesPath"
          :selected="appState.selectedFiles || []"
          :focused-index="
            appState.focusedList === 'files' ? appState.focusedIndex : null
          "
          @update-path="updateFilePath"
          @lock-hotkeys="() => (hotkeysLockedByInput = true)"
          @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          @toggle-focus="toggleFileFocus"
          @toggle-select="toggleFileSelect"
          @toggle-select-all="toggleSelectAllFiles"
        />
        <div v-else class="flex-1" />
      </div>
      <FocusedEvent
        v-if="getFocusedEvent()"
        :key="`event-${appState.focusedIndex}-${appState.focusedField}-${updateFocused}`"
        ref="focusedRef"
        :event="getFocusedEvent()"
        :field="appState.focusedField"
        :fields="['text', 'memory']"
        :is-locked="isLocked"
        :get-prompt="getPrompt"
        @update-event="updateFocusedEvent"
        @remove-event="removeFocusedEvent"
        @update-app-state="(key, value) => appState.upsertDBSync(key, value)"
        @copy="onCopy"
        @gen="onGen"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <FocusedTopic
        ref="focusedRef"
        v-else-if="getFocusedTopic() !== null"
        :key="`topic-${appState.focusedIndex}-${getFocusedTopicLevel()}`"
        :topic="getFocusedTopic()"
        :level="getFocusedTopicLevel()"
        :events="events"
        @update-topic="updateFocusedTopic"
        @remove-topic="removeFocusedTopic"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <FocusedFile
        ref="focusedRef"
        v-else-if="getFocusedFile() !== null"
        :key="`file-${appState.focusedIndex}`"
        :file="getFocusedFile()"
      />
      <div class="flex flex-col gap-2 w-[310px]">
        <Topics
          :topics="topics"
          :events="events"
          :selected="appState.selectedTopics || []"
          :focused-index="
            appState.focusedList === 'topics' ? appState.focusedIndex : null
          "
          @new-topic="newTopic"
          @toggle-focus="toggleTopicFocus"
          @toggle-select="toggleTopicSelect"
          @toggle-select-all="toggleSelectAllTopics"
          @sort-up="sortTopic(1)"
          @sort-down="sortTopic(-1)"
        />
      </div>
    </div>
    <!-- # bot ---------------------------------------------------------------->
    <div
      class="flex flex-col items-center rounded-lg overflow-hidden flex-shrink-0"
    >
      <div class="rounded-lg overflow-hidden">
        <ButtonDark @click="onFileSave"> save </ButtonDark>
        <ButtonDark @click="onFileLoad" theme="dark"> load </ButtonDark>
        <ButtonDark
          @click="restoreEvent"
          theme="dark"
          :disabled="!lastRemovedEvent"
        >
          restore
        </ButtonDark>
      </div>
    </div>
  </div>
</template>

<script setup>
const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()
const { events, topics, appState } = useDatabase()

// els refs
const focusedRef = ref(null)
const filesRef = ref(null)

// reactive
const files = ref(null)
const isLocked = reactive({
  copy: { text: false, name: false, memory: false },
  gen: { text: false, name: false, memory: false },
})
const updateFocused = ref(0)

// regular
let lastRemovedEvent = null
let cleanupHotkeys
const hotkeys = {
  // left hand
  w: () => toggleEventFocus(events.length - 1),
  c: () => onCopy("name"),
  j: () => filesRef.value?.focusPath(),
  u: () => focusedRef.value?.focusName(),
  e: () => focusedRef.value?.focusTop(),
  o: () => focusedRef.value?.focusBot(),
  g: () => scrollToBot(focusedRef.value?.textareaEl),
  i: () => scrollToTop(focusedRef.value?.textareaEl),

  // right hand
  h: () => appState.upsertDBSync("focusedField", "text"),
  t: () => appState.upsertDBSync("focusedField", "memory"),
  n: () => appState.upsertDBSync("focusedField", null),
  m: () => onCopy("text"),
  l: () => onCopy("memory"),
  f: () => toggleTopicFocus(topics.length - 1),

  // both hands
  "{": toggleDown,
  "}": toggleUp,
}

onMounted(async () => {
  events.loadFromDB()
  topics.loadFromDB()
  await appState.loadFromDB()
  cleanupHotkeys = setupHotkeys(hotkeys)
  getFiles()
})
onUnmounted(cleanupHotkeys)

/////////////////////////////////// files //////////////////////////////////////
async function updateFilePath(path) {
  appState.upsertDBSync("filesPath", path)
  if (appState.focusedList === "files") {
    appState.upsertDBSync("focusedIndex", null)
  }
  await getFiles()
  appState.selectedFiles = Array(files.value.length).fill(false)
  appState.upsertDBSync("selectedFiles", appState.selectedFiles)
}
async function getFiles() {
  files.value = await apiGetFiles({
    path: appState.filesPath,
    ignore: [
      ".nuxt",
      ".output",
      ".vscode",
      "node_modules",
      "public",
      ".env",
      ".gitignore",
      "package-lock.json",
    ],
  })
}
function toggleFileFocus(i) {
  const same = appState.focusedList === "files" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "files")
}
function toggleFileSelect(i, state) {
  appState.selectedFiles[i] = state
  appState.upsertDBSync("selectedFiles", appState.selectedFiles)
}
function toggleSelectAllFiles(state) {
  appState.selectedFiles = appState.selectedFiles.map(() => state)
  appState.upsertDBSync("selectedFiles", appState.selectedFiles)
}
/////////////////////////////////// events /////////////////////////////////////
function newEvent() {
  events.upsertDBSync({
    id: newId(),
    date: new Date().toISOString(),
    name: "now",
    text: "",
    memory: "",
  })
  toggleEventFocus(events.length - 1)
  appState.upsertDBSync("focusedField", "text")
  appState.selectedEvents.push(null)
  nextTick(() => focusedRef.value?.focusBot())
}
function toggleEventFocus(i) {
  const same = appState.focusedList === "events" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "events")
}
function updateFocusedEvent([key, value]) {
  getFocusedEvent()[key] = value
  events.upsertDBSync(getFocusedEvent())
}
function toggleEventSelect(i, state) {
  appState.selectedEvents[i] = state
  appState.upsertDBSync("selectedEvents", appState.selectedEvents)
}
function toggleSelectAllEvents(state) {
  appState.selectedEvents = appState.selectedEvents.map(() => state)
  appState.upsertDBSync("selectedEvents", appState.selectedEvents)
}
function removeFocusedEvent() {
  lastRemovedEvent = getFocusedEvent()
  events.removeDBSync(getFocusedEvent())
}
function restoreEvent() {
  events.upsertDBSync(lastRemovedEvent)
  toggleEventFocus(events.findIndex((e) => e.id === lastRemovedEvent.id))
  lastRemovedEvent = null
}
////////////////////////////////// topics //////////////////////////////////////
function newTopic() {
  topics.insertDBSync("topic")
  toggleTopicFocus(topics.length - 1)
  appState.selectedTopics.push(0)
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
function toggleTopicFocus(i) {
  const same = appState.focusedList === "topics" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "topics")
}
function updateFocusedTopic(topic) {
  topics[appState.focusedIndex] = topic
  topics.updateDBSync()
}
function removeFocusedTopic() {
  topics.removeDBSync(getFocusedTopic())
}
function toggleTopicSelect(i, level) {
  appState.selectedTopics[i] = level
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
function toggleSelectAllTopics(level) {
  appState.selectedTopics = appState.selectedTopics.map(() => level)
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
function sortTopic(direction) {
  const index = topics.indexOf(getFocusedTopic())
  if (direction > 0 && index === topics.length - 1) return
  if (direction < 0 && index === 0) return
  const newIndex = index + direction

  const topic = topics[index]
  topics.splice(index, 1)
  topics.splice(newIndex, 0, topic)
  topics.updateDBSync()

  const selectState = appState.selectedTopics[index]
  appState.selectedTopics.splice(index, 1)
  appState.selectedTopics.splice(newIndex, 0, selectState)

  appState.upsertDBSync("focusedIndex", newIndex)
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
///////////////////////////////// copy gen /////////////////////////////////////
function onCopy(field) {
  if (!getFocusedEvent()) return // hotkey case
  copyToClipboard({ input: getPrompt(field), locked: isLocked.copy, field })
}
async function onGen(field) {
  await getFiles()
  await apiGen({
    model: field === "name" ? "gemini-2.0-flash" : "gemini-2.0-pro-exp-02-05",
    input: getPrompt(field),
    event: getFocusedEvent(),
    locked: isLocked.gen,
    field,
    onNextChunk: events.tUpsertDBSync,
  })
}
////////////////////////////// file save load //////////////////////////////////
async function onFileSave() {
  const filename = `stone ${events[events.length - 1]?.name || ""}.json`
  fileSave(filename, { events, topics, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    appState.upsertDBSync("focusedIndex", null)

    events.clearDBSync()
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

    topics.clearDBSync()
    await Promise.all(loadedData.topics.map((t) => topics.insertDBSync(t)))

    const entries = Object.entries(loadedData.appState)
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))
    console.log(`⏬ data loaded from file [${timestamp()}]`)

    updateFocused.value++
  })
}
///////////////////////////////// helpers //////////////////////////////////////
function getPrompt(field) {
  if (!files.value) return ""
  let prompt
  if (field === "text") prompt = promptText
  else if (field === "name") prompt = promptName
  else if (field === "memory") prompt = promptMemory
  return prompt(events, topics, files.value, appState)
}
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  return topics[appState.focusedIndex]
}
function getFocusedFile() {
  if (!files.value) return null
  if (appState.focusedList !== "files") return null
  return files.value[appState.focusedIndex] || null
}
function getFocusedTopicLevel() {
  const topicIndex = topics.indexOf(getFocusedTopic())
  return appState.selectedTopics[topicIndex]
}
function toggleDown() {
  const list = appState.focusedList === "topics" ? topics : events
  let index =
    appState.focusedIndex === null ? list.length - 1 : appState.focusedIndex - 1
  if (index < 0) return
  appState.focusedList === "topics"
    ? toggleTopicFocus(index)
    : toggleEventFocus(index)
}
function toggleUp() {
  const list = appState.focusedList === "topics" ? topics : events
  let index = appState.focusedIndex === null ? 0 : appState.focusedIndex + 1
  if (index > list.length - 1) return
  appState.focusedList === "topics"
    ? toggleTopicFocus(index)
    : toggleEventFocus(index)
}
</script>
