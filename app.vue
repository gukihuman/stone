<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-3 p-1 pb-8">
    <!-- main field -->
    <div class="flex overflow-hidden justify-between gap-3 flex-grow">
      <!-- events -->
      <Events
        :events-by-id="eventsById"
        :events-sorted="eventsSorted"
        :edit-event-id="editEventId"
        :total-recent-memories="totalRecentMemories"
        :recent-event-limit="recentEventLimit"
        @toggle-event-edit="toggleEventEdit"
        @local-storage-save="debouncedLocalStorageSave"
        @recent-limit-more="recentEventLimit++"
        @recent-limit-less="recentEventLimit--"
      />
      <!-- edit block -->
      <div
        class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
        v-if="editEventId || editTopicId"
      >
        <!-- edit menu top -->
        <div class="w-full flex min-h-11 rounded-t-lg overflow-hidden">
          <input
            ref="nameRef"
            type="text"
            v-model="name"
            @input="updateOnInput"
            @focus="isAnyInputFocused = true"
            @blur="isAnyInputFocused = false"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
          />
          <input
            ref="dateRef"
            v-if="editEventId"
            type="text"
            v-model="date"
            @input="updateOnInput"
            @focus="isAnyInputFocused = true"
            @blur="isAnyInputFocused = false"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-stone-300 truncate hover:bg-stone-800"
          />
        </div>
        <!-- paper -->
        <Paper
          ref="paperRef"
          v-if="
            editEventId
              ? editEventMod === EVENT_MODS.TEXT ||
                editEventMod === EVENT_MODS.MEMORY_RAW
              : editTopicMod === TOPIC_MODS.MEMORY_IDS_RAW
          "
          v-model="paper"
          @input="updateOnInput"
          @focus="isAnyInputFocused = true"
          @blur="isAnyInputFocused = false"
          :is-any-input-focused="isAnyInputFocused"
          :update="`${editEventMod}${editEventId}${editTopicId}`"
          :theme="
            editTopicId || editEventMod === EVENT_MODS.MEMORY_RAW
              ? 'dark'
              : 'light'
          "
        />
        <Records
          v-else
          @focus="isAnyInputFocused = true"
          @blur="isAnyInputFocused = false"
          :memory-records-by-id="memoryRecordsById"
          :events-by-id="eventsById"
          :topics-by-id="topicsById"
          :edit-event-id="editEventId"
          :edit-topic-id="editTopicId"
          :is-any-input-focused="isAnyInputFocused"
          :update="`${editEventMod}${editEventId}${editTopicId}`"
          theme="light"
          @local-storage-save="debouncedLocalStorageSave"
        />
        <!-- edit menu bot -->
        <div class="flex flex-col w-full bg-stone-700">
          <div
            class="flex px-3 py-2 border-stone-600 border-b-[3px] border-dashed"
            v-if="editEventId"
          >
            <div class="flex gap-2 w-[330px] justify-end">
              <div class="pt-[3px]">
                <Binary
                  v-if="tokensForNow"
                  :groups="toBinaryGroups(tokensForNow)"
                  theme="light"
                />
              </div>
              <span class="text-stone-400 leading-[19px] self-end"> now </span>
              <ButtonLight @click="onCopyNow" :disabled="copyLockedNow">
                copy
              </ButtonLight>
              <ButtonLight @click="onGenNow" :disabled="genNowLocked">
                gen
              </ButtonLight>
            </div>
          </div>
          <div class="flex p-3 justify-between">
            <Switch
              v-if="editEventId"
              v-model="editEventMod"
              :labels="editEventModLabels"
              @change="onEditModChange"
            />
            <Switch
              v-else
              v-model="editTopicMod"
              :labels="editTopicModLabels"
              @change="onEditModChange"
            />
            <div
              v-if="editEventId"
              class="flex gap-2 flex-grow pr-10 justify-end"
            >
              <div class="pt-[3px]">
                <Binary
                  v-if="tokensForMakeMemory"
                  :groups="toBinaryGroups(tokensForMakeMemory)"
                  theme="light"
                />
              </div>
              <span class="text-stone-400 leading-[19px] self-end"> make </span>
              <ButtonLight
                @click="onCopyMakeMemory"
                :disabled="copyLockedMakeMemory"
              >
                copy
              </ButtonLight>
              <ButtonLight
                @click="onGenMakeMemory"
                :disabled="genMakeMemoryLocked"
              >
                gen
              </ButtonLight>
            </div>
            <div v-else class="flex gap-2 flex-grow pr-10 justify-end">
              <div class="pt-[3px]">
                <Binary
                  v-if="tokensForMakeTopicIds"
                  :groups="toBinaryGroups(tokensForMakeTopicIds)"
                  theme="light"
                />
              </div>
              <span class="text-stone-400 leading-[19px] self-end"> make </span>
              <ButtonLight
                @click="onCopyMakeTopicIds"
                :disabled="copyLockedMakeTopicIds"
              >
                copy
              </ButtonLight>
              <ButtonLight
                @click="onGenMakeTopicIds"
                :disabled="genMakeTopicIdsLocked"
              >
                gen
              </ButtonLight>
            </div>
            <ButtonLight @click="editEventId ? removeEvent() : removeTopic()">
              remove
            </ButtonLight>
          </div>
        </div>
      </div>
      <!-- topics -->
      <Topics
        :topics-by-id="topicsById"
        :topics-sorted="topicsSorted"
        :edit-topic-id="editTopicId"
        :total-topic-memories="totalTopicMemories"
        :is-any-input-focused="isAnyInputFocused"
        :memory-records-by-id="memoryRecordsById"
        @toggle-topic-edit="toggleTopicEdit"
        @local-storage-save="debouncedLocalStorageSave"
      />
    </div>
    <!-- main bottom menu -->
    <div
      class="flex flex-col items-center rounded-lg overflow-hidden flex-shrink-0"
    >
      <div class="rounded-lg overflow-hidden">
        <ButtonDark @click="onFileSave"> save </ButtonDark>
        <ButtonDark @click="onFileLoad" theme="dark"> load </ButtonDark>
        <ButtonDark @click="restore" theme="dark" :disabled="!removed">
          restore
        </ButtonDark>
      </div>
    </div>
  </div>
</template>
<script setup>
import { RESPONSE_TYPE } from "~/utils/genWithMistral.js"

const APP_LOCAL_STORAGE_KEY = "stone"
const EVENT_MODS = { TEXT: 0, MEMORY_RAW: 1, MEMORY: 2 }
const TOPIC_MODS = { MEMORY_IDS_RAW: 0, MEMORY: 1 }
const STICK_GEN_HEIGHT = 120

const editEventMod = ref(EVENT_MODS.TEXT)
const editEventModLabels = {
  text: EVENT_MODS.TEXT,
  raw: EVENT_MODS.MEMORY_RAW,
  memory: EVENT_MODS.MEMORY,
}
const editTopicMod = ref(TOPIC_MODS.MEMORY_IDS_RAW)
const editTopicModLabels = {
  raw: TOPIC_MODS.MEMORY_IDS_RAW,
  memory: TOPIC_MODS.MEMORY,
}

const memoryRecordsById = ref({}) // main memory storage
const eventsById = ref({})
const topicsById = ref({})
const editEventId = ref(null)
const editTopicId = ref(null)
const recentEventLimit = ref(5)
let genEventId = null
let genEventMod = null
let genTopicId = null
let genTopicMod = null

// dom elements
const nameRef = ref(null)
const dateRef = ref(null)
const paperRef = ref(null)

// handle v-model fields to edit
const name = ref("")
const date = ref("")
const paper = ref("")

let removed = null

const copyLockedNow = ref(false)
const copyLockedMakeMemory = ref(false)
const copyLockedMakeTopicIds = ref(false)
const genNowLocked = ref(false)
const genMakeMemoryLocked = ref(false)
const genMakeTopicIdsLocked = ref(false)

const isAnyInputFocused = ref(false)

// nicely debounced
const tokensForNow = ref(0)
const tokensForMakeMemory = ref(0)
const tokensForMakeTopicIds = ref(0)

const debouncedLocalStorageSave = debounce(localStorageSave)
const debouncedUpdateMemories = debounce(updateMemoriesWithNewIds)
const debouncedUpdateTopics = debounce(updateTopics)
const debouncedUpdateTokensForNow = debounce(updateTokensForNow)
const debouncedUpdateTokensForMakeMemory = debounce(updateTokensForMakeMemory)
const debouncedUpdateTokensForMakeTopicIds = debounce(
  updateTokensForMakeTopicIds
)
const throttledLocalStorageSave = throttle(localStorageSave)
const throttledUpdateMemories = throttle(updateMemoriesWithNewIds)
const throttledUpdateTopics = throttle(updateTopics)

const eventsSorted = computed(() => {
  return Object.entries(eventsById.value).sort(
    ([, a], [, b]) => a.sort - b.sort
  )
})
const topicsSorted = computed(() => {
  return Object.entries(topicsById.value).sort(
    ([, a], [, b]) => a.sort - b.sort
  )
})
const totalTopicMemories = computed(() => {
  return Object.values(topicsById.value).reduce((sum, topic) => {
    if (topic.selected) return sum + topic.memoryIds.length
    return sum
  }, 0)
})
const totalRecentMemories = computed(() => {
  const editEvent = eventsById.value[editEventId.value]
  if (!editEvent) return
  return Object.values(eventsById.value).reduce((sum, e) => {
    if (
      editEvent.sort > e.sort &&
      e.sort >= Math.max(editEvent.sort - recentEventLimit.value, 0)
    ) {
      return sum + e.memoryIds.length
    }
    return sum
  }, 0)
})
watch(
  () => eventsById, // on input
  () => {
    debouncedUpdateTokensForNow()
    debouncedUpdateTokensForMakeMemory()
  },
  { deep: true }
)
watch(
  () => memoryRecordsById, // on input
  () => {
    debouncedUpdateTokensForMakeTopicIds()
  },
  { deep: true }
)
watch(
  () => [editEventId, recentEventLimit, topicsById],
  () => updateTokensForNow(),
  { deep: true }
)
watch(
  () => editEventId, // on change event
  () => updateTokensForMakeMemory(),
  { deep: true }
)
watch(
  () => [topicsById], // on change topic
  () => updateTokensForMakeTopicIds(),
  { deep: true }
)
onMounted(() => {
  addEventListener("keydown", onKeyDown)
  localStorageLoad()
  updateTokensForNow()
  updateTokensForMakeMemory()
  updateTokensForMakeTopicIds()
})
async function updateTokensForNow() {
  if (!editEventId.value) return
  tokensForNow.value = getTokens(await getPromptCopyNow())
}
async function updateTokensForMakeMemory() {
  if (!editEventId.value) return
  tokensForMakeMemory.value = getTokens(await getPromptMakeMemory())
}
async function updateTokensForMakeTopicIds() {
  if (!editTopicId.value) return
  tokensForMakeTopicIds.value = getTokens(await getPromptMakeTopicIds())
}
function localStorageLoad() {
  const storageRaw = localStorage.getItem(APP_LOCAL_STORAGE_KEY)
  if (storageRaw) injectStorage(JSON.parse(storageRaw))
}
function localStorageSave() {
  localStorage.setItem(APP_LOCAL_STORAGE_KEY, JSON.stringify(getStorage()))
  console.log(`⏬ local storage updated [${timestamp()}]`)
}
function injectStorage(storage) {
  memoryRecordsById.value = storage.memoryRecordsById
  eventsById.value = storage.eventsById
  topicsById.value = storage.topicsById
  editEventId.value = storage.editEventId
  editTopicId.value = storage.editTopicId
  editEventMod.value = storage.editEventMod
  editTopicMod.value = storage.editTopicMod
  recentEventLimit.value = storage.recentEventLimit
  updateInputFields()
}
function getStorage() {
  return {
    memoryRecordsById: memoryRecordsById.value,
    eventsById: eventsById.value,
    topicsById: topicsById.value,
    editEventId: editEventId.value,
    editTopicId: editTopicId.value,
    editEventMod: editEventMod.value,
    editTopicMod: editTopicMod.value,
    recentEventLimit: recentEventLimit.value,
  }
}
function toggleEventEdit(id) {
  if (editEventId.value === id) editEventId.value = null
  else editEventId.value = id
  editTopicId.value = null
  updateInputFields()
  debouncedLocalStorageSave()
}
function toggleTopicEdit(id) {
  if (editTopicId.value === id) editTopicId.value = null
  else editTopicId.value = id
  editEventId.value = null
  updateInputFields()
  debouncedLocalStorageSave()
}
const onEditModChange = () => {
  updateInputFields()
  debouncedLocalStorageSave()
}
function updateInputFields() {
  const editEvent = eventsById.value[editEventId.value]
  if (editEvent) {
    name.value = editEvent.name
    date.value = editEvent.date
    editEventMod.value === EVENT_MODS.MEMORY_RAW
      ? (paper.value = editEvent.memoryRecordsRaw)
      : (paper.value = editEvent.text)
  }
  const editTopic = topicsById.value[editTopicId.value]
  if (editTopic) {
    name.value = editTopic.name
    paper.value = editTopic.memoryIdsRaw
  }
}
function updateOnInput() {
  const editEvent = eventsById.value[editEventId.value]
  if (editEvent) {
    editEvent.name = name.value
    editEvent.date = date.value
    if (editEventMod.value === EVENT_MODS.MEMORY_RAW) {
      editEvent.memoryRecordsRaw = paper.value
      debouncedUpdateMemories(editEvent)
    } else {
      editEvent.text = paper.value
    }
  }
  const editTopic = topicsById.value[editTopicId.value]
  if (editTopic) {
    editTopic.name = name.value
    editTopic.memoryIdsRaw = paper.value
    debouncedUpdateTopics(editTopic)
  }
  debouncedLocalStorageSave()
}
function updateMemoriesWithNewIds(event) {
  event.memoryIds.forEach((id) => delete memoryRecordsById.value[id])
  event.memoryIds = []
  try {
    const parsedMemory = JSON.parse(event.memoryRecordsRaw)
    if (Array.isArray(parsedMemory)) {
      parsedMemory.forEach((item) => {
        const id = newId()
        event.memoryIds.push(id)
        memoryRecordsById.value[id] = item
      })
    } else {
      throw new Error("memory input must be a JSON array,")
    }
    console.log(`⏬ memoryRecordsRaw updated [${timestamp()}]`)
  } catch (error) {
    const resetString = "memory of this event has been reset"
    if (error instanceof SyntaxError) {
      console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
    } else {
      console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
    }
  }
}
function updateTopics(topic) {
  topic.memoryIds = []
  try {
    const parsedMemoryIds = JSON.parse(topic.memoryIdsRaw)
    if (Array.isArray(parsedMemoryIds)) {
      topic.memoryIds = parsedMemoryIds
    } else {
      throw new Error("topic input must be a JSON array,")
    }
    console.log(`⏬ topic updated [${timestamp()}]`)
  } catch (error) {
    const resetString = "topic has been reset"
    if (error instanceof SyntaxError) {
      console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
    } else {
      console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
    }
  }
}
function removeEvent() {
  removed = {}
  const id = editEventId.value
  removed.event = eventsById.value[editEventId.value]
  removed.editEventId = id
  toggleEventEdit(id)
  delete eventsById.value[id]
  Object.values(eventsById.value).forEach((event) => {
    if (event.sort > removed.event.sort) event.sort--
  })
  removed.event.memoryIds.forEach((id) => delete memoryRecordsById.value[id])
}
function removeTopic() {
  removed = {}
  const id = editTopicId.value
  removed.topic = topicsById.value[editTopicId.value]
  removed.editTopicId = id
  toggleTopicEdit(id)
  delete topicsById.value[id]
  Object.values(topicsById.value).forEach((topic) => {
    if (topic.sort > removed.topic.sort) topic.sort--
  })
}
function restore() {
  if (!removed) return
  if (removed.event) {
    eventsById.value[removed.editEventId] = {
      ...removed.event,
      sort: Object.keys(eventsById.value).length,
    }
    toggleEventEdit(removed.editEventId)
    updateMemoriesWithNewIds(eventsById.value[removed.editEventId])
  } else {
    topicsById.value[removed.editTopicId] = {
      ...removed.topic,
      sort: Object.keys(topicsById.value).length,
    }
    toggleTopicEdit(removed.editTopicId)
  }
  removed = null
  debouncedLocalStorageSave()
}
async function onFileSave() {
  const mostRecentEvent = eventsSorted.value[eventsSorted.value.length - 1][1]
  fileSave(`stone ${mostRecentEvent.name}.json`, getStorage())
}
async function onFileLoad() {
  await fileLoad(injectStorage)
  debouncedLocalStorageSave()
}
function onKeyDown(event) {
  if (document.activeElement === nameRef.value && event.key === "Escape") {
    nameRef.value.blur()
  }
  if (document.activeElement === dateRef.value && event.key === "Escape") {
    dateRef.value.blur()
  }
  if (nameRef.value && !isAnyInputFocused.value && event.key === "c") {
    event.preventDefault()
    nextTick(() => {
      nameRef.value.focus()
      nameRef.value.setSelectionRange(0, nameRef.value.value.length)
    })
  }
  if (dateRef.value && !isAnyInputFocused.value && event.key === "u") {
    event.preventDefault()
    nextTick(() => {
      dateRef.value.focus()
      dateRef.value.setSelectionRange(
        dateRef.value.value.length,
        dateRef.value.value.length
      )
    })
  }
  if (editEventId.value && !isAnyInputFocused.value && event.key === "y") {
    event.preventDefault()
    nextTick(() => onCopyNow())
  }
  if (editEventId.value && !isAnyInputFocused.value && event.key === "m") {
    event.preventDefault()
    nextTick(() => onCopyMakeMemory())
  }
  if (editTopicId.value && !isAnyInputFocused.value && event.key === "m") {
    event.preventDefault()
    nextTick(() => onCopyMakeTopicIds())
  }
  if (!isAnyInputFocused.value && editEventId.value) {
    if (event.key === "h") {
      editEventMod.value = EVENT_MODS.TEXT
      onEditModChange()
    } else if (event.key === "t") {
      editEventMod.value = EVENT_MODS.MEMORY_RAW
      onEditModChange()
    } else if (event.key === "n") {
      editEventMod.value = EVENT_MODS.MEMORY
      onEditModChange()
    }
  }
  if (!isAnyInputFocused.value && editTopicId.value) {
    if (event.key === "t") {
      editTopicMod.value = TOPIC_MODS.MEMORY_IDS_RAW
      onEditModChange()
    } else if (event.key === "n") {
      editTopicMod.value = TOPIC_MODS.MEMORY
      onEditModChange()
    }
  }
  if (!isAnyInputFocused.value && eventsSorted.value.length) {
    if (event.key === "w") {
      toggleEventEdit(eventsSorted.value[eventsSorted.value.length - 1][0])
    }
  }
}
async function getPromptCopyNow() {
  if (!editEventId.value) return
  return await promptNow(
    memoryRecordsById.value,
    topicsSorted.value,
    eventsSorted.value,
    eventsById.value[editEventId.value],
    recentEventLimit.value
  )
}
async function getPromptMakeMemory() {
  if (!editEventId.value) return
  return await promptMakeMemory(
    memoryRecordsById.value,
    eventsById.value[editEventId.value]
  )
}
async function getPromptMakeTopicIds() {
  if (!editTopicId.value) return
  return await promptMakeTopicIds(
    memoryRecordsById.value,
    topicsSorted.value,
    topicsById.value[editTopicId.value].name
  )
}
async function onGenNow() {
  genNowLocked.value = true
  genEventId = editEventId.value
  genEventMod = EVENT_MODS.TEXT

  const editEvent = eventsById.value[editEventId.value]
  editEvent.text += "\n\nJane\n"
  onNextChunk() // to see Jane addition immideately
  await genWithMistral(await getPromptCopyNow(), editEvent, "text", onNextChunk)
  editEvent.text += "\n\nGuki\n"
  onNextChunk() // one last time to update Guki addition

  genEventMod = null
  genEventId = null
  genNowLocked.value = false
}
async function onGenMakeMemory() {
  genMakeMemoryLocked.value = true
  genEventId = editEventId.value
  genEventMod = EVENT_MODS.MEMORY_RAW

  const editEvent = eventsById.value[editEventId.value]
  editEvent.memoryRecordsRaw = ""
  onNextChunk() // to see clearing records immideately
  await genWithMistral(
    await getPromptMakeMemory(),
    editEvent,
    "memoryRecordsRaw",
    onNextChunk,
    RESPONSE_TYPE.JSON
  )

  genEventMod = null
  genEventId = null
  genMakeMemoryLocked.value = false
}
async function onGenMakeTopicIds() {
  genMakeTopicIdsLocked.value = true
  genTopicId = editTopicId.value
  genTopicMod = TOPIC_MODS.MEMORY_IDS_RAW

  const editTopic = topicsById.value[editTopicId.value]
  editTopic.memoryIdsRaw = ""
  onNextChunk() // to see clearing ids immideately
  await genWithMistral(
    await getPromptMakeTopicIds(),
    editTopic,
    "memoryIdsRaw",
    onNextChunk,
    RESPONSE_TYPE.JSON
  )

  genTopicMod = null
  genTopicId = null
  genMakeTopicIdsLocked.value = false
}
function onNextChunk() {
  const editEvent = eventsById.value[editEventId.value]
  const editTopic = topicsById.value[editTopicId.value]
  throttledLocalStorageSave()
  if (genEventId === editEventId.value && genEventMod === editEventMod.value) {
    updatePaperOnNextChunk()
    throttledUpdateMemories(editEvent)
  }
  if (genTopicId === editTopicId.value && genTopicMod === editTopicMod.value) {
    updatePaperOnNextChunk()
    throttledUpdateTopics(editTopic)
  }
}
function updatePaperOnNextChunk() {
  updateInputFields()
  nextTick(() => {
    const el = paperRef.value.screenRef
    if (el.scrollTop + el.clientHeight > el.scrollHeight - STICK_GEN_HEIGHT) {
      scrollToBot(el)
    }
  })
}
async function onCopyNow() {
  copyToClipboard(await getPromptCopyNow(), copyLockedNow)
}
async function onCopyMakeMemory() {
  copyToClipboard(await getPromptMakeMemory(), copyLockedMakeMemory)
}
async function onCopyMakeTopicIds() {
  copyToClipboard(await getPromptMakeTopicIds(), copyLockedMakeTopicIds)
}
</script>
