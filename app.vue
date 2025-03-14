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
        :is-copy-make-memory-locked="isCopyMakeMemoryLocked"
        :copy-make-memory-tokens="copyMakeMemoryTokens"
        @update-event="updateFocusedEvent"
        @remove-event="removeFocusedEvent"
        @update-app-state="(key, value) => appState.upsertDBSync(key, value)"
        @copy-make-memory="onCopyMakeMemory"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <FocusedTopic
        v-else-if="getFocusedTopic()"
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
const isCopyMakeMemoryLocked = ref(null)
const copyMakeMemoryTokens = computed(() => {
  return getTokens(
    promptMakeMemory(events, topics, appState.selectedTopics, getFocusedEvent())
  )
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

  h: () => appState.upsertDBSync("focusedEditField", "text"),
  t: () => appState.upsertDBSync("focusedEditField", "memoryRaw"),
  l: () => onCopyMakeMemory(),
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
///////////////////////////////// helpers //////////////////////////////////////
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  return topics[appState.focusedIndex] || null
}
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
/////////////////////////////////// copy ///////////////////////////////////////
async function onCopyMakeMemory() {
  if (!getFocusedEvent()) return
  copyToClipboard(
    await promptMakeMemory(
      events,
      topics,
      appState.selectedTopics,
      getFocusedEvent()
    ),
    isCopyMakeMemoryLocked
  )
}
/////////////////////////////////// gen ////////////////////////////////////////
// async function onGenNow() {
//   genNowLocked.value = true
//   genEventId = focusedIndex.value
//   genEventMod = EVENT_MOD_TYPES.TEXT

//   const editEvent = eventsById.value[focusedIndex.value]
//   editEvent.text += "\n\nJane\n"
//   onNextChunk() // to see Jane addition immideately
//   await genWithMistral(await getPromptCopyNow(), editEvent, "text", onNextChunk)
//   editEvent.text += "\n\nGuki\n"
//   onNextChunk() // one last time to update Guki addition

//   genEventMod = null
//   genEventId = null
//   genNowLocked.value = false
// }
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
///////////////////////////////// fallback /////////////////////////////////////

// const copyLockedNow = ref(false)
// const isCopyMakeMemoryLocked = ref(false)
// const copyLockedMakeTopicIds = ref(false)
// const genNowLocked = ref(false)
// const genMakeMemoryLocked = ref(false)
// const genMakeTopicIdsLocked = ref(false)

// const tokensForNow = ref(0)
// const tokensForMakeMemory = ref(0)
// const tokensForMakeTopicIds = ref(0)

// const debouncedUpdateMemories = debounce(updateMemoriesWithNewIds)
// const debouncedUpdateTopics = debounce(updateTopics)
// const debouncedUpdateTokensForNow = debounce(updateTokensForNow)
// const throttledUpdateMemories = throttle(updateMemoriesWithNewIds)
// const throttledUpdateTopics = throttle(updateTopics)

// const totalTopicMemories = computed(() => {
//   return Object.values(topicsById.value).reduce((sum, topic) => {
//     if (topic.selected) return sum + topic.memoryIds.length
//     return sum
//   }, 0)
// })
// const totalRecentMemories = computed(() => {
//   const editEvent = eventsById.value[focusedIndex.value]
//   if (!editEvent) return
//   return Object.values(eventsById.value).reduce((sum, e) => {
//     if (
//       editEvent.sort > e.sort &&
//       e.sort >= Math.max(editEvent.sort - recentEventLimit.value, 0)
//     ) {
//       return sum + e.memoryIds.length
//     }
//     return sum
//   }, 0)
// })
// async function updateTokensForNow() {
//   if (!focusedIndex.value) return
//   tokensForNow.value = getTokens(await getPromptCopyNow())
// }
// function updateMemoriesWithNewIds(event) {
//   event.memoryIds.forEach((id) => delete memoryRecordsById.value[id])
//   event.memoryIds = []
//   try {
//     const parsedMemory = JSON.parse(event.memoryRecordsRaw)
//     if (Array.isArray(parsedMemory)) {
//       parsedMemory.forEach((item) => {
//         const id = newId()
//         event.memoryIds.push(id)
//         memoryRecordsById.value[id] = item
//       })
//     } else {
//       throw new Error("memory input must be a JSON array,")
//     }
//     console.log(`⏬ memoryRecordsRaw updated [${timestamp()}]`)
//   } catch (error) {
//     const resetString = "memory of this event has been reset"
//     if (error instanceof SyntaxError) {
//       console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
//     } else {
//       console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
//     }
//   }
// }
// function updateTopics(topic) {
//   topic.memoryIds = []
//   try {
//     const parsedMemoryIds = JSON.parse(topic.memoryIdsRaw)
//     if (Array.isArray(parsedMemoryIds)) {
//       topic.memoryIds = parsedMemoryIds
//     } else {
//       throw new Error("topic input must be a JSON array,")
//     }
//     console.log(`⏬ topic updated [${timestamp()}]`)
//   } catch (error) {
//     const resetString = "topic has been reset"
//     if (error instanceof SyntaxError) {
//       console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
//     } else {
//       console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
//     }
//   }
// }
// async function getPromptCopyNow() {
//   if (!focusedIndex.value) return
//   return await promptNow(
//     memoryRecordsById.value,
//     topicsSorted.value,
//     eventsSorted.value,
//     eventsById.value[focusedIndex.value],
//     recentEventLimit.value
//   )
// }
// async function onGenNow() {
//   genNowLocked.value = true
//   genEventId = focusedIndex.value
//   genEventMod = EVENT_MOD_TYPES.TEXT

//   const editEvent = eventsById.value[focusedIndex.value]
//   editEvent.text += "\n\nJane\n"
//   onNextChunk() // to see Jane addition immideately
//   await genWithMistral(await getPromptCopyNow(), editEvent, "text", onNextChunk)
//   editEvent.text += "\n\nGuki\n"
//   onNextChunk() // one last time to update Guki addition

//   genEventMod = null
//   genEventId = null
//   genNowLocked.value = false
// }
// function onNextChunk() {
//   const editEvent = eventsById.value[focusedIndex.value]
//   const editTopic = topicsById.value[editTopicId.value]
//   throttledLocalStorageSave()
//   if (genEventId === focusedIndex.value && genEventMod === eventMod.value) {
//     updatePaperOnNextChunk()
//     throttledUpdateMemories(editEvent)
//   }
//   if (genTopicId === editTopicId.value && genTopicMod === editTopicMod.value) {
//     updatePaperOnNextChunk()
//     throttledUpdateTopics(editTopic)
//   }
// }
// function updatePaperOnNextChunk() {
//   updateInputFields()
//   nextTick(() => {
//     const el = paperRef.value.screenRef
//     if (el.scrollTop + el.clientHeight > el.scrollHeight - STICK_GEN_HEIGHT) {
//       scrollToBot(el)
//     }
//   })
// }
// async function onCopyNow() {
//   copyToClipboard(await getPromptCopyNow(), copyLockedNow)
// }
</script>
