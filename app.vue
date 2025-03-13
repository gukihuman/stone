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
        @update-event="updateFocusedEvent"
        @remove-event="removeFocusedEvent"
        @update-app-state="(key, value) => appState.upsertDBSync(key, value)"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <FocusedTopic
        v-else-if="getFocusedTopic()"
        :key="`focused-topic-${appState.focusedIndex}`"
        ref="focusedRef"
        :topic="getFocusedTopic()"
        @update-topic="updateFocusedTopic"
        @remove-item="removeFocusedTopic"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <Topics
        :topics="topics"
        :focused-index="
          appState.focusedList === 'topics' ? appState.focusedIndex : null
        "
        @new-topic="newTopic"
        @toggle-topic-focus="toggleTopicFocus"
        @sort-topic-up="sortTopicUp"
        @sort-topic-down="sortTopicDown"
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

// regular
let lastRemovedEvent = null
let cleanupHotkeys
const hotkeys = {
  w: () => toggleEventFocus(events.length - 1),
  i: () => scrollToTop(focusedRef.value?.textareaEl),
  g: () => scrollToBot(focusedRef.value?.textareaEl),
  u: () => focusedRef.value?.focusName(),
  o: () => focusedRef.value?.focusBot(),
  e: () => focusedRef.value?.focusTop(),
  h: () => appState.upsertDBSync("focusedEditField", "text"),
  t: () => appState.upsertDBSync("focusedEditField", "memoryRaw"),
}

// reactive
const focusedRef = ref(null)

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
  appState.upsertDBSync("focusedIndex", null)
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
  appState.upsertDBSync("focusedIndex", null)
  appState.upsertDBSync("focusedList", null)
}
function sortTopicUp() {
  const index = topics.indexOf(getFocusedTopic())
  if (index === topics.length - 1) return
  const topic = topics[index]
  topics.splice(index, 1)
  topics.splice(index + 1, 0, topic)
  topics.updateDBSync()
  appState.upsertDBSync("focusedIndex", index + 1)
}
function sortTopicDown() {
  const index = topics.indexOf(getFocusedTopic())
  console.log(index)
  if (index === 0) return
  const topic = topics[index]
  topics.splice(index, 1)
  topics.splice(index - 1, 0, topic)
  topics.updateDBSync()
  appState.upsertDBSync("focusedIndex", index - 1)
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
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))
    console.log(`⏬ data loaded from file [${timestamp()}]`)

    // not react to same focused after load, reset cleaner for now
    appState.upsertDBSync("focusedIndex", null)
    appState.upsertDBSync("focusedList", null)
  })
}
///////////////////////////////// fallback /////////////////////////////////////

// const editTopicMod = ref(TOPIC_MODS.MEMORY_IDS_RAW)
// const editTopicModLabels = {
//   raw: TOPIC_MODS.MEMORY_IDS_RAW,
//   memory: TOPIC_MODS.MEMORY,
// }
// const memoryRecordsById = ref({}) // main memory storage
// const topicsById = ref({})
// const editTopicId = ref(null)
// let genEventId = null
// let genEventMod = null
// let genTopicId = null
// let genTopicMod = null

// let lastRemovedEvent = null

// const copyLockedNow = ref(false)
// const copyLockedMakeMemory = ref(false)
// const copyLockedMakeTopicIds = ref(false)
// const genNowLocked = ref(false)
// const genMakeMemoryLocked = ref(false)
// const genMakeTopicIdsLocked = ref(false)

// const hotkeysLockedByInput = ref(false)

// nicely debounced
// const tokensForNow = ref(0)
// const tokensForMakeMemory = ref(0)
// const tokensForMakeTopicIds = ref(0)

// const debouncedLocalStorageSave = debounce(localStorageSave)
// const debouncedUpdateMemories = debounce(updateMemoriesWithNewIds)
// const debouncedUpdateTopics = debounce(updateTopics)
// const debouncedUpdateTokensForNow = debounce(updateTokensForNow)
// const throttledLocalStorageSave = throttle(localStorageSave)
// const throttledUpdateMemories = throttle(updateMemoriesWithNewIds)
// const throttledUpdateTopics = throttle(updateTopics)

// const eventsSorted = computed(() => {
//   return Object.entries(eventsById.value).sort(
//     ([, a], [, b]) => a.sort - b.sort
//   )
// })
// const topicsSorted = computed(() => {
//   return Object.entries(topicsById.value).sort(
//     ([, a], [, b]) => a.sort - b.sort
//   )
// })
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
// watch(
//   () => eventsById, // on input
//   () => debouncedUpdateTokensForNow(),
//   { deep: true }
// )
// watch(
//   () => [focusedIndex, recentEventLimit, topicsById],
//   () => updateTokensForNow(),
//   { deep: true }
// )
// function onRemoveEvent() {
//   lastRemovedEvent = {}
//   const id = focusedIndex.value
//   lastRemovedEvent.event = eventsById.value[focusedIndex.value]
//   lastRemovedEvent.focusedIndex = id
//   toggleEventEdit(id)
//   delete eventsById.value[id]
//   Object.values(eventsById.value).forEach((event) => {
//     if (event.sort > lastRemovedEvent.event.sort) event.sort--
//   })
//   lastRemovedEvent.event.memoryIds.forEach((id) => delete memoryRecordsById.value[id])
// }
// async function updateTokensForNow() {
//   if (!focusedIndex.value) return
//   tokensForNow.value = getTokens(await getPromptCopyNow())
// }
// async function onFileSave() {
//   const mostRecentEvent = eventsSorted.value[eventsSorted.value.length - 1][1]
//   fileSave(`stone ${mostRecentEvent.name}.json`, getStorage())
// }
// async function onFileLoad() {
//   await fileLoad(injectStorage)
//   debouncedLocalStorageSave()
// }
// function injectStorage(storage) {
//   memoryRecordsById.value = storage.memoryRecordsById
//   eventsById.value = storage.eventsById
//   topicsById.value = storage.topicsById
//   focusedIndex.value = storage.focusedIndex
//   editTopicId.value = storage.editTopicId
//   eventMod.value = storage.eventMod
//   editTopicMod.value = storage.editTopicMod
//   recentEventLimit.value = storage.recentEventLimit
//   updateInputFields()
// }
// function getStorage() {
//   return {
//     memoryRecordsById: memoryRecordsById.value,
//     eventsById: eventsById.value,
//     topicsById: topicsById.value,
//     focusedIndex: focusedIndex.value,
//     editTopicId: editTopicId.value,
//     eventMod: eventMod.value,
//     editTopicMod: editTopicMod.value,
//     recentEventLimit: recentEventLimit.value,
//   }
// }
// function toggleTopicEdit(id) {
//   if (editTopicId.value === id) editTopicId.value = null
//   else editTopicId.value = id
//   focusedIndex.value = null
//   updateInputFields()
//   debouncedLocalStorageSave()
// }
// const onEditModChange = () => {
//   updateInputFields()
//   debouncedLocalStorageSave()
// }
// function updateInputFields() {
//   const editEvent = eventsById.value[focusedIndex.value]
//   if (editEvent) {
//     name.value = editEvent.name
//     date.value = editEvent.date
//     eventMod.value === EVENT_MOD_TYPES.MEMORY_RAW
//       ? (paper.value = editEvent.memoryRecordsRaw)
//       : (paper.value = editEvent.text)
//   }
//   const editTopic = topicsById.value[editTopicId.value]
//   if (editTopic) {
//     name.value = editTopic.name
//     paper.value = editTopic.memoryIdsRaw
//   }
// }
// function updateOnInput() {
//   const editEvent = eventsById.value[focusedIndex.value]
//   if (editEvent) {
//     editEvent.name = name.value
//     editEvent.date = date.value
//     if (eventMod.value === EVENT_MOD_TYPES.MEMORY_RAW) {
//       editEvent.memoryRecordsRaw = paper.value
//       debouncedUpdateMemories(editEvent)
//     } else {
//       editEvent.text = paper.value
//     }
//   }
//   const editTopic = topicsById.value[editTopicId.value]
//   if (editTopic) {
//     editTopic.name = name.value
//     editTopic.memoryIdsRaw = paper.value
//     debouncedUpdateTopics(editTopic)
//   }
//   debouncedLocalStorageSave()
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
// function removeTopic() {
//   lastRemovedEvent = {}
//   const id = editTopicId.value
//   lastRemovedEvent.topic = topicsById.value[editTopicId.value]
//   lastRemovedEvent.editTopicId = id
//   toggleTopicEdit(id)
//   delete topicsById.value[id]
//   Object.values(topicsById.value).forEach((topic) => {
//     if (topic.sort > lastRemovedEvent.topic.sort) topic.sort--
//   })
// }
// function restore() {
//   if (!lastRemovedEvent) return
//   if (lastRemovedEvent.event) {
//     eventsById.value[lastRemovedEvent.focusedIndex] = {
//       ...lastRemovedEvent.event,
//       sort: Object.keys(eventsById.value).length,
//     }
//     toggleEventEdit(lastRemovedEvent.focusedIndex)
//     updateMemoriesWithNewIds(eventsById.value[lastRemovedEvent.focusedIndex])
//   } else {
//     topicsById.value[lastRemovedEvent.editTopicId] = {
//       ...lastRemovedEvent.topic,
//       sort: Object.keys(topicsById.value).length,
//     }
//     toggleTopicEdit(lastRemovedEvent.editTopicId)
//   }
//   lastRemovedEvent = null
//   debouncedLocalStorageSave()
// }
// function onKeyDown(event) {
//   if (document.activeElement === nameRef.value && event.key === "Escape") {
//     nameRef.value.blur()
//   }
//   if (document.activeElement === dateRef.value && event.key === "Escape") {
//     dateRef.value.blur()
//   }
//   if (nameRef.value && !hotkeysLockedByInput.value && event.key === "c") {
//     event.preventDefault()
//     nextTick(() => {
//       nameRef.value.focus()
//       nameRef.value.setSelectionRange(0, nameRef.value.value.length)
//     })
//   }
//   if (dateRef.value && !hotkeysLockedByInput.value && event.key === "u") {
//     event.preventDefault()
//     nextTick(() => {
//       dateRef.value.focus()
//       dateRef.value.setSelectionRange(
//         dateRef.value.value.length,
//         dateRef.value.value.length
//       )
//     })
//   }
//   if (focusedIndex.value && !hotkeysLockedByInput.value && event.key === "y") {
//     event.preventDefault()
//     nextTick(() => onCopyNow())
//   }
//   if (focusedIndex.value && !hotkeysLockedByInput.value && event.key === "m") {
//     event.preventDefault()
//     nextTick(() => onCopyMakeMemory())
//   }
//   if (editTopicId.value && !hotkeysLockedByInput.value && event.key === "m") {
//     event.preventDefault()
//     nextTick(() => onCopyMakeTopicIds())
//   }
//   if (!hotkeysLockedByInput.value && focusedIndex.value) {
//     if (event.key === "h") {
//       eventMod.value = EVENT_MOD_TYPES.TEXT
//       onEditModChange()
//     } else if (event.key === "t") {
//       eventMod.value = EVENT_MOD_TYPES.MEMORY_RAW
//       onEditModChange()
//     } else if (event.key === "n") {
//       eventMod.value = EVENT_MOD_TYPES.MEMORY
//       onEditModChange()
//     }
//   }
//   if (!hotkeysLockedByInput.value && editTopicId.value) {
//     if (event.key === "t") {
//       editTopicMod.value = TOPIC_MODS.MEMORY_IDS_RAW
//       onEditModChange()
//     } else if (event.key === "n") {
//       editTopicMod.value = TOPIC_MODS.MEMORY
//       onEditModChange()
//     }
//   }
//   if (!hotkeysLockedByInput.value && eventsSorted.value.length) {
//     if (event.key === "w") {
//       toggleEventEdit(eventsSorted.value[eventsSorted.value.length - 1][0])
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
