<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-3 p-1 pb-8">
    <!-- # mid ---------------------------------------------------------------->
    <div class="flex overflow-hidden justify-between gap-3 flex-grow">
      <Events
        :events="events"
        :focused-index="
          appState.focusedList === 'events' ? appState.focusedIndex : null
        "
        @new-event="newEvent"
        @toggle-event-focus="toggleEventFocus"
      />
      <FocusedEvent
        v-if="getFocusedEvent()"
        :key="`focused-event-${appState.focusedIndex}-${appState.focusedEditField}`"
        ref="focusedRef"
        :event="getFocusedEvent()"
        :edit-field="appState.focusedEditField"
        :edit-fields="['text', 'memoryRaw']"
        :is-copy-now-locked="isCopyNowLocked"
        :is-gen-now-locked="isGenNowLocked"
        :is-copy-make-memory-locked="isCopyMakeMemoryLocked"
        :is-gen-make-memory-locked="isGenMakeMemoryLocked"
        :copy-now-tokens="copyNowTokens"
        :copy-make-memory-tokens="copyMakeMemoryTokens"
        @update-event="updateFocusedEvent"
        @remove-event="removeFocusedEvent"
        @update-app-state="(key, value) => appState.upsertDBSync(key, value)"
        @copy-now="onCopyNow"
        @gen-now="onGenNow"
        @copy-make-memory="onCopyMakeMemory"
        @gen-make-memory="onGenMakeMemory"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <FocusedTopic
        v-else-if="getFocusedTopic() !== null"
        :key="`focused-topic-${appState.focusedIndex}`"
        ref="focusedRef"
        :topic="getFocusedTopic()"
        @update-topic="updateFocusedTopic"
        @remove-topic="removeFocusedTopic"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
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

// reactive
const isCopyNowLocked = ref(null)
const isGenNowLocked = ref(null)
const isCopyMakeMemoryLocked = ref(null)
const isGenMakeMemoryLocked = ref(null)

const copyMakeMemoryTokens = computed(() => getTokens(getPromptMakeMemory()))
const copyNowTokens = computed(() => getTokens(getPromptNow()))

// regular
let lastRemovedEvent = null
let cleanupHotkeys
const hotkeys = {
  w: () => toggleEventFocus(events.length - 1),
  u: () => focusedRef.value?.focusName(),
  o: () => focusedRef.value?.focusBot(),
  e: () => focusedRef.value?.focusTop(),
  g: () => scrollToBot(focusedRef.value?.textareaEl),
  i: () => scrollToTop(focusedRef.value?.textareaEl),

  h: () => appState.upsertDBSync("focusedEditField", "text"),
  t: () => appState.upsertDBSync("focusedEditField", "memoryRaw"),
  l: () => onCopyMakeMemory(),
  y: () => onCopyNow(),
}

onMounted(() => {
  events.loadFromDB()
  topics.loadFromDB()
  appState.loadFromDB()
  cleanupHotkeys = setupHotkeys(hotkeys)
})
onUnmounted(cleanupHotkeys)

/////////////////////////////////// event //////////////////////////////////////
function newEvent() {
  events.upsertDBSync({
    id: newId(),
    date: new Date().toISOString(),
    name: "now",
    text: "",
    memoryRaw: "",
  })
  toggleEventFocus(events.length - 1)
  appState.upsertDBSync("focusedEditField", "text")
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
  appState.selectedTopics.push(1)
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
/////////////////////////////////// copy ///////////////////////////////////////
function onCopyNow() {
  if (!getFocusedEvent()) return
  copyToClipboard(getPromptNow(), isCopyNowLocked)
}
function onCopyMakeMemory() {
  if (!getFocusedEvent()) return
  copyToClipboard(getPromptMakeMemory(), isCopyMakeMemoryLocked)
}
/////////////////////////////////// gen ////////////////////////////////////////
async function onGenNow() {
  console.log("of")
  await gen({
    message: getPromptNow(),
    genEvent: getFocusedEvent(),
    field: "text",
    genLocked: isGenNowLocked,
    onNextChunk: events.tUpsertDBSync,
    responseType: "string",
  })
}
async function onGenMakeMemory() {
  getFocusedEvent().memoryRaw = ""
  await gen({
    message: getPromptMakeMemory(),
    genEvent: getFocusedEvent(),
    field: "memoryRaw",
    genLocked: isGenMakeMemoryLocked,
    onNextChunk: events.tUpsertDBSync,
    responseType: "json",
  })
}
////////////////////////////// file save load //////////////////////////////////
async function onFileSave() {
  const filename = `stone ${events[events.length - 1]?.name || ""}.json`
  fileSave(filename, { events, topics, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    events.clearDBSync()
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

    topics.clearDBSync()
    await Promise.all(loadedData.topics.map((t) => topics.insertDBSync(t)))

    const entries = Object.entries(loadedData.appState)
    console.log(loadedData.appState)
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))
    console.log(`⏬ data loaded from file [${timestamp()}]`)

    // not react to same focused after load, reset cleaner for now
    appState.upsertDBSync("focusedIndex", null)
    appState.upsertDBSync("focusedList", null)
  })
}
///////////////////////////////// helpers //////////////////////////////////////
function getPromptNow() {
  return promptNow(events, topics, appState.selectedTopics, getFocusedEvent())
}
function getPromptMakeMemory() {
  return promptMakeMemory(
    events,
    topics,
    appState.selectedTopics,
    getFocusedEvent()
  )
}
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  return topics[appState.focusedIndex]
}
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
</script>
