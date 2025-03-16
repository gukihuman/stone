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
        :key="`event-${appState.focusedIndex}-${appState.focusedField}`"
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
        v-else-if="getFocusedTopic() !== null"
        :key="`topic-${appState.focusedIndex}-${getFocusedTopicLevel()}`"
        ref="focusedRef"
        :topic="getFocusedTopic()"
        :level="getFocusedTopicLevel()"
        :events="events"
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
const isLocked = reactive({
  copy: { text: false, name: false, memory: false },
  gen: { text: false, name: false, memory: false },
})

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

  h: () => appState.upsertDBSync("focusedField", "text"),
  t: () => appState.upsertDBSync("focusedField", "memory"),
  n: () => appState.upsertDBSync("focusedField", null),
  y: () => onCopy("text"),
  m: () => onCopy("name"),
  l: () => onCopy("memory"),
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
    memory: "",
  })
  toggleEventFocus(events.length - 1)
  appState.upsertDBSync("focusedField", "text")
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
///////////////////////////////// copy gen /////////////////////////////////////
function onCopy(field) {
  if (!getFocusedEvent()) return // hotkey case
  copyToClipboard({ input: getPrompt(field), locked: isLocked.copy, field })
}
async function onGen(field) {
  await gen({
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
function getPrompt(field) {
  let prompt
  if (field === "text") prompt = promptText
  else if (field === "name") prompt = promptName
  else if (field === "memory") prompt = promptMemory
  return prompt(events, topics, appState.selectedTopics, getFocusedEvent())
}
// function getPromptNow() {
//   return promptNow(events, topics, appState.selectedTopics, getFocusedEvent())
// }
// function getPromptName() {
//   return promptName(events, topics, appState.selectedTopics, getFocusedEvent())
// }
// function getPromptMakeMemory() {
//   return promptMakeMemory(
//     events,
//     topics,
//     appState.selectedTopics,
//     getFocusedEvent()
//   )
// }
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  return topics[appState.focusedIndex]
}
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
function getFocusedTopicLevel() {
  const topicIndex = topics.indexOf(getFocusedTopic())
  return appState.selectedTopics[topicIndex]
}
</script>
