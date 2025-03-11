<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-3 p-1 pb-8">
    <!-- main field -->
    <div class="flex overflow-hidden justify-between gap-3 flex-grow">
      <Events
        :events="events"
        :focused-event-index="appState.focusedEventIndex"
        @new-event="newEvent"
        @toggle-event-focus="toggleEventFocus"
      />
      <Focused
        ref="focusedRef"
        v-if="getFocusedEvent()"
        :event="getFocusedEvent()"
        @update-name="updateFocusedEventName"
        @remove="removeFocusedEvent"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
      />
      <!-- topics -->
      <div class="w-[250px] flex-shrink-0"></div>
    </div>
    <!-- main bottom menu -->
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
const { events, appState } = useDatabase()

const focusedRef = ref(null)

let lastRemovedEvent = null
let cleanupHotkeys

const hotkeys = {
  w: () => toggleEventFocus(events.length - 1),
  u: () => focusedRef.value?.focusName(),
}

onMounted(() => {
  events.loadFromDB()
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
}
function toggleEventFocus(index) {
  const newValue = appState.focusedEventIndex === index ? null : index
  appState.upsertDBSync("focusedEventIndex", newValue)
}
function updateFocusedEventName(name) {
  getFocusedEvent().name = name
  events.upsertDBSync(getFocusedEvent())
}
function removeFocusedEvent() {
  lastRemovedEvent = getFocusedEvent()
  events.removeDBSync(getFocusedEvent().id)
  appState.upsertDBSync("focusedEventIndex", null)
}
function restoreEvent() {
  events.upsertDBSync(lastRemovedEvent)
  toggleEventFocus(events.findIndex((e) => e.id === lastRemovedEvent.id))
  lastRemovedEvent = null
}
// helper
function getFocusedEvent() {
  return events[appState.focusedEventIndex]
}
/////////////////////////////// file save load /////////////////////////////////
async function onFileSave() {
  const filename = `stone ${events[events.length - 1]?.name || ""}.json`
  fileSave(filename, { events, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    events.length = 0
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

    const entries = Object.entries(loadedData.appState)
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))

    console.log(`⏬ data loaded from file [${timestamp()}]`)
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
//   const editEvent = eventsById.value[focusedEventIndex.value]
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
//   () => [focusedEventIndex, recentEventLimit, topicsById],
//   () => updateTokensForNow(),
//   { deep: true }
// )
// function onRemoveEvent() {
//   lastRemovedEvent = {}
//   const id = focusedEventIndex.value
//   lastRemovedEvent.event = eventsById.value[focusedEventIndex.value]
//   lastRemovedEvent.focusedEventIndex = id
//   toggleEventEdit(id)
//   delete eventsById.value[id]
//   Object.values(eventsById.value).forEach((event) => {
//     if (event.sort > lastRemovedEvent.event.sort) event.sort--
//   })
//   lastRemovedEvent.event.memoryIds.forEach((id) => delete memoryRecordsById.value[id])
// }
// async function updateTokensForNow() {
//   if (!focusedEventIndex.value) return
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
//   focusedEventIndex.value = storage.focusedEventIndex
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
//     focusedEventIndex: focusedEventIndex.value,
//     editTopicId: editTopicId.value,
//     eventMod: eventMod.value,
//     editTopicMod: editTopicMod.value,
//     recentEventLimit: recentEventLimit.value,
//   }
// }
// function toggleTopicEdit(id) {
//   if (editTopicId.value === id) editTopicId.value = null
//   else editTopicId.value = id
//   focusedEventIndex.value = null
//   updateInputFields()
//   debouncedLocalStorageSave()
// }
// const onEditModChange = () => {
//   updateInputFields()
//   debouncedLocalStorageSave()
// }
// function updateInputFields() {
//   const editEvent = eventsById.value[focusedEventIndex.value]
//   if (editEvent) {
//     name.value = editEvent.name
//     date.value = editEvent.date
//     eventMod.value === EVENT_MOD.MEMORY_RAW
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
//   const editEvent = eventsById.value[focusedEventIndex.value]
//   if (editEvent) {
//     editEvent.name = name.value
//     editEvent.date = date.value
//     if (eventMod.value === EVENT_MOD.MEMORY_RAW) {
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
//     eventsById.value[lastRemovedEvent.focusedEventIndex] = {
//       ...lastRemovedEvent.event,
//       sort: Object.keys(eventsById.value).length,
//     }
//     toggleEventEdit(lastRemovedEvent.focusedEventIndex)
//     updateMemoriesWithNewIds(eventsById.value[lastRemovedEvent.focusedEventIndex])
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
//   if (focusedEventIndex.value && !hotkeysLockedByInput.value && event.key === "y") {
//     event.preventDefault()
//     nextTick(() => onCopyNow())
//   }
//   if (focusedEventIndex.value && !hotkeysLockedByInput.value && event.key === "m") {
//     event.preventDefault()
//     nextTick(() => onCopyMakeMemory())
//   }
//   if (editTopicId.value && !hotkeysLockedByInput.value && event.key === "m") {
//     event.preventDefault()
//     nextTick(() => onCopyMakeTopicIds())
//   }
//   if (!hotkeysLockedByInput.value && focusedEventIndex.value) {
//     if (event.key === "h") {
//       eventMod.value = EVENT_MOD.TEXT
//       onEditModChange()
//     } else if (event.key === "t") {
//       eventMod.value = EVENT_MOD.MEMORY_RAW
//       onEditModChange()
//     } else if (event.key === "n") {
//       eventMod.value = EVENT_MOD.MEMORY
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
//   if (!focusedEventIndex.value) return
//   return await promptNow(
//     memoryRecordsById.value,
//     topicsSorted.value,
//     eventsSorted.value,
//     eventsById.value[focusedEventIndex.value],
//     recentEventLimit.value
//   )
// }
// async function onGenNow() {
//   genNowLocked.value = true
//   genEventId = focusedEventIndex.value
//   genEventMod = EVENT_MOD.TEXT

//   const editEvent = eventsById.value[focusedEventIndex.value]
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
//   const editEvent = eventsById.value[focusedEventIndex.value]
//   const editTopic = topicsById.value[editTopicId.value]
//   throttledLocalStorageSave()
//   if (genEventId === focusedEventIndex.value && genEventMod === eventMod.value) {
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
