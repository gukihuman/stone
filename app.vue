<template>
  <div class="flex bg-stone-600 h-screen gap-2 p-1">
    <!-- # left col events files ---------------------------------------------->
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
        :focused-i="
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
    <!-- # mid ---------------------------------------------------------------->
    <div class="flex w-full gap-2">
      <div class="flex flex-col flex-grow gap-2 justify-end">
        <FocusedEvent
          v-if="getFocusedEvent()"
          :key="`event-${appState.focusedIndex}-${appState.focusedField}-${appState.focusedEntity}-${updateFocused}`"
          ref="focusedRef"
          :event="getFocusedEvent()"
          :field="appState.focusedField"
          :fields="['text', 'memory']"
          :is-locked="isLocked"
          :get-prompt="getPrompt"
          :focused-entity="appState.focusedEntity"
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
          :key="`topic-${appState.focusedIndex}-${
            appState.focusedEntity
          }-${getFocusedTopicLevel()}`"
          :topic="getFocusedTopic()"
          :level="getFocusedTopicLevel()"
          :events="events"
          :focused-entity="appState.focusedEntity"
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
        <FocusedDraft
          ref="focusedDraftRef"
          v-if="appState.draft !== undefined"
          :modelValue="appState.draft"
          @update:modelValue="(value) => appState.upsertDBSync('draft', value)"
          @append="appendDraftToEvent"
          @lock-hotkeys="() => (hotkeysLockedByInput = true)"
          @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
        />
        <FocusedShape
          ref="focusedShapeRef"
          :events="events"
          :topics="topics"
          :shapes="shapes"
          :files="files"
          :app-state="appState"
          :focused-entity="appState.focusedEntity"
          @execute-shape="onExecuteShape"
          @lock-hotkeys="() => (hotkeysLockedByInput = true)"
          @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
        />
        <div class="flex gap-4 items-center justify-between">
          <Switch
            :model-value="appState.focusedEntity"
            :states="entities"
            @update:modelValue="onEntitySwitch"
            theme="dark"
          />
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
      </div>
      <div class="flex flex-col gap-2 w-[310px] flex-shrink-0">
        <Topics
          :topics="topics[appState.focusedEntity] || []"
          :events="events"
          :selected="appState.selectedTopics?.[appState.focusedEntity] || []"
          :focused-index="
            appState.focusedList === 'topics' ? appState.focusedIndex : null
          "
          :focused-entity="appState.focusedEntity"
          @new-topic="newTopic"
          @toggle-focus="toggleTopicFocus"
          @toggle-select="toggleTopicSelect"
          @toggle-select-all="toggleSelectAllTopics"
          @sort-up="sortTopic(1)"
          @sort-down="sortTopic(-1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()
const { entities, events, topics, shapes, appState } = useDatabase()

// els refs
const focusedRef = ref(null)
const focusedDraftRef = ref(null)
const focusedShapeRef = ref(null)
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
  a: () => onEntitySwitch("jane"),

  q: () => appendDraftToEvent(),
  c: () => focusedRef.value?.focusName(),
  u: () => focusedRef.value?.focus(),
  e: () => focusedDraftRef.value?.focus(),
  o: () => focusedShapeRef.value?.focus(),

  b: () => filesRef.value?.focusPath(),
  g: () => scrollToBot(focusedRef.value?.textareaEl),
  i: () => scrollToTop(focusedRef.value?.textareaEl),

  // right hand
  r: () => onEntitySwitch("rox"),

  h: () => appState.upsertDBSync("focusedField", "text"),
  t: () => appState.upsertDBSync("focusedField", "memory"),
  n: () => appState.upsertDBSync("focusedField", null),
  f: () => toggleTopicFocus(topics[appState.focusedEntity].length - 1),

  m: () => onCopy("text"),
  l: () => onCopy("memory"),

  // both hands
  "{": toggleDown,
  "}": toggleUp,
}

onMounted(async () => {
  events.loadFromDB()
  topics.loadFromDB()
  shapes.loadFromDB()
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
    memory: {},
  })
  toggleEventFocus(events.length - 1)
  appState.upsertDBSync("focusedField", "text")
  if (!appState.selectedEvents) appState.selectedEvents = []
  while (appState.selectedEvents.length < events.length) {
    appState.selectedEvents.push(false)
  }
  appState.upsertDBSync("selectedEvents", appState.selectedEvents)
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
  topics[appState.focusedEntity].push("topic")
  topics.updateDBSync()
  toggleTopicFocus(topics[appState.focusedEntity].length - 1)

  if (!appState.selectedTopics[entity]) appState.selectedTopics[entity] = []
  appState.selectedTopics[appState.focusedEntity].push(0)
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
function toggleTopicFocus(i) {
  const same = appState.focusedList === "topics" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "topics")
}
function updateFocusedTopic(newTopicName) {
  const entity = appState.focusedEntity
  const i = appState.focusedIndex
  if (topics[entity] && topics[entity][i] !== undefined) {
    topics[entity][i] = newTopicName
    topics.updateDBSync()
  }
}
function removeFocusedTopic() {
  topics.removeDBSync(getFocusedTopic())
}
function toggleTopicSelect(i, level) {
  const entity = appState.focusedEntity
  appState.selectedTopics[entity][i] = level
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)
}
function toggleSelectAllTopics(level) {
  const entity = appState.focusedEntity
  if (appState.selectedTopics[entity]) {
    appState.selectedTopics[entity] = appState.selectedTopics[entity].map(
      () => level
    )
    appState.upsertDBSync("selectedTopics", appState.selectedTopics)
  }
}
function sortTopic(direction) {
  const entityTopics = topics[appState.focusedEntity]
  const entitySelectedTopics = appState.selectedTopics[appState.focusedEntity]
  const i = appState.focusedIndex
  if (!entityTopics || !entitySelectedTopics || i === null) return
  if (
    (direction > 0 && i === entityTopics.length - 1) ||
    (direction < 0 && i === 0)
  ) {
    return
  }
  const newIndex = i + direction

  const topic = entityTopics[i]
  entityTopics.splice(i, 1)
  entityTopics.splice(newIndex, 0, topic)

  const selectState = entitySelectedTopics[i]
  entitySelectedTopics.splice(i, 1)
  entitySelectedTopics.splice(newIndex, 0, selectState)

  topics.updateDBSync()
  appState.upsertDBSync("selectedTopics", appState.selectedTopics)

  appState.upsertDBSync("focusedIndex", newIndex)
}
///////////////////////////////// copy gen /////////////////////////////////////
function onCopy(field) {
  if (!getFocusedEvent()) return // hotkey case
  copyToClipboard({ input: getPrompt(field), locked: isLocked.copy, field })
}
async function onGen(field) {
  await getFiles()
  await apiGen({
    model: "gemini-2.0-flash",
    input: getPrompt(field),
    event: getFocusedEvent(),
    locked: isLocked.gen,
    field,
    focusedEntity: appState.focusedEntity,
    onNextChunk: events.tUpsertDBSync,
  })
}
////////////////////////////////// entity //////////////////////////////////////
function onEntitySwitch(value) {
  appState.upsertDBSync("focusedEntity", value)
  if (appState.focusedList === "topics") {
    appState.upsertDBSync("focusedList", null)
    appState.upsertDBSync("focusedIndex", null)
  }
}
////////////////////////////// file save load //////////////////////////////////
async function onFileSave() {
  const filename = `stone ${events[events.length - 1]?.name || ""}.json`
  fileSave(filename, { events, topics, shapes, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    appState.upsertDBSync("focusedIndex", null)

    events.clearDBSync()
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

    await topics.clearDBSync()
    entities.forEach((entity) => (topics[entity] = loadedData.topics[entity]))
    await topics.updateDBSync()

    await shapes.clearDBSync()
    for (const entity of entities) {
      const shapePromises = Object.entries(loadedData.shapes[entity]).map(
        ([name, fn]) => shapes.upsertDBSync(entity, name, eval(fn))
      )
      await Promise.all(shapePromises)
    }

    const entries = Object.entries(loadedData.appState)
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))
    console.log(`⏬ data loaded from file [${timestamp()}]`)

    updateFocused.value++
  })
}
///////////////////////////////// helpers //////////////////////////////////////
function getPrompt(field) {
  if (!files.value) return "" // ❗ ruins whole prompt if no files
  let prompt
  if (field === "text") prompt = promptText
  else if (field === "name") prompt = promptName
  else if (field === "memory") prompt = promptMemory
  return prompt(events, topics, shapes, files.value, appState)
}
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
function getFocusedFile() {
  if (!files.value) return null
  if (appState.focusedList !== "files") return null
  return files.value[appState.focusedIndex] || null
}
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  const entity = appState.focusedEntity
  return topics[entity][appState.focusedIndex]
}
function getFocusedTopicLevel() {
  const entity = appState.focusedEntity
  return appState.selectedTopics[entity][appState.focusedIndex]
}
function toggleDown() {
  const list = appState.focusedList === "topics" ? topics : events
  let i =
    appState.focusedIndex === null ? list.length - 1 : appState.focusedIndex - 1
  if (i < 0) return
  appState.focusedList === "topics" ? toggleTopicFocus(i) : toggleEventFocus(i)
}
function toggleUp() {
  const list = appState.focusedList === "topics" ? topics : events
  let i = appState.focusedIndex === null ? 0 : appState.focusedIndex + 1
  if (i > list.length - 1) return
  appState.focusedList === "topics" ? toggleTopicFocus(i) : toggleEventFocus(i)
}
/////////////////////////////////// new shit ///////////////////////////////////
function onExecuteShape(codeString) {
  const shapeFn = new Function(
    "events",
    "topics",
    "shapes",
    "files",
    "appState",
    codeString
  )
  shapeFn(events, topics, shapes, files, appState)
  console.log("✅ Shape executed successfully.")
}

function appendDraftToEvent() {
  const currentEvent = getFocusedEvent()
  if (!currentEvent || !appState.draft) return
  currentEvent.text = [
    currentEvent.text,
    `${capitalize(useRuntimeConfig().public.human)}\n${appState.draft}`,
    `${capitalize(appState.focusedEntity)}\n`,
  ].join("\n\n")
  updateFocusedEvent(["text", currentEvent.text])
  appState.upsertDBSync("draft", "")
  nextTick(() => scrollToBot(focusedRef.value?.textareaEl))
}
</script>
