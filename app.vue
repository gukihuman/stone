<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-3 p-1">
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
          v-model="paper"
          @input="updateOnInput"
          @focus="isAnyInputFocused = true"
          @blur="isAnyInputFocused = false"
          :isAnyInputFocused="isAnyInputFocused"
          :update="`${editEventMod}${editEventId}${editTopicId}`"
          :theme="
            editTopicId || editEventMod === EDIT_EVENT_MODS.MEMORY
              ? 'dark'
              : 'light'
          "
        />
        <!-- edit menu bot -->
        <div
          class="flex w-full p-3 bg-stone-700"
          :class="editEventId ? 'justify-between' : 'justify-end'"
        >
          <Switch
            v-if="editEventId"
            v-model="editEventMod"
            :labels="editEventModLabels"
            @change="handlePaperModChange"
          />
          <ButtonLight
            v-if="editEventId"
            @click="copySelectedMemoriesPrompt"
            :disabled="copySelectedLocked"
          >
            copy {{ totalRecentMemories + totalTopicMemories }}
            {{ (totalRecentMemories + totalTopicMemories) * AVERAGE_TOKENS }}
          </ButtonLight>
          <ButtonLight @click="editEventId ? removeEvent() : removeTopic()"
            >remove
          </ButtonLight>
        </div>
      </div>
      <!-- topics -->
      <Topics
        :topics-by-id="topicsById"
        :topics-sorted="topicsSorted"
        :edit-topic-id="editTopicId"
        :total-topic-memories="totalTopicMemories"
        @toggle-topic-edit="toggleTopicEdit"
        @local-storage-save="debouncedLocalStorageSave"
      />
    </div>
    <!-- main bottom menu -->
    <div
      class="flex flex-col items-center rounded-lg overflow-hidden flex-shrink-0"
    >
      <div class="w-fit rounded-lg overflow-hidden">
        <ButtonDark @click="copyAllMemories" :disabled="copyAllLocked">
          copy {{ totalMemories }}
          {{ totalMemories * AVERAGE_JSON_TOKENS + BASE_PROMPT_TOKENS }}
        </ButtonDark>
        <ButtonDark @click="fileSave('stone.json', getStorage())">
          save
        </ButtonDark>
        <ButtonDark @click="onFileLoad" theme="dark"> load </ButtonDark>
        <ButtonDark @click="restore" theme="dark" :disabled="!removed">
          restore
        </ButtonDark>
      </div>
    </div>
  </div>
</template>
<script setup>
const APP_LOCAL_STORAGE_KEY = "stone"
const AVERAGE_TOKENS = 50
const AVERAGE_JSON_TOKENS = 60
const BASE_PROMPT_TOKENS = 5700
const EDIT_EVENT_MODS = { TEXT: 0, MEMORY: 1 }

const editEventMod = ref(EDIT_EVENT_MODS.TEXT)
const editEventModLabels = {
  text: EDIT_EVENT_MODS.TEXT,
  memory: EDIT_EVENT_MODS.MEMORY,
}

const nameRef = ref(null)
const dateRef = ref(null)

const memoryStringsById = ref({}) // main memory storage
const eventsById = ref({})
const topicsById = ref({})
const editEventId = ref(null)
const editTopicId = ref(null)
const recentEventLimit = ref(5)

// handle v-model fields to edit
const name = ref("")
const date = ref("")
const paper = ref("")

let removed = null

const copySelectedLocked = ref(false)
const copyAllLocked = ref(false)
const isAnyInputFocused = ref(false)

const debouncedLocalStorageSave = debounce(localStorageSave)
const debouncedUpdateMemories = debounce(updateMemories)
const debouncedUpdateTopics = debounce(updateTopics)

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
const totalMemories = computed(
  () => Object.keys(memoryStringsById.value).length
)

onMounted(() => {
  addEventListener("keydown", onKeyDown)
  localStorageLoad()
})

function localStorageLoad() {
  const storageRaw = localStorage.getItem(APP_LOCAL_STORAGE_KEY)
  if (storageRaw) injectStorage(JSON.parse(storageRaw))
}
function localStorageSave() {
  localStorage.setItem(APP_LOCAL_STORAGE_KEY, JSON.stringify(getStorage()))
  console.log(`⏬ local storage updated [${timestamp()}]`)
}
function injectStorage(storage) {
  memoryStringsById.value = storage.memoryStringsById
  eventsById.value = storage.eventsById
  topicsById.value = storage.topicsById
  editEventId.value = storage.editEventId
  editTopicId.value = storage.editTopicId
  editEventMod.value = storage.editEventMod
  recentEventLimit.value = storage.recentEventLimit
  updateInputFields()
}
function getStorage() {
  return {
    memoryStringsById: memoryStringsById.value,
    eventsById: eventsById.value,
    topicsById: topicsById.value,
    editEventId: editEventId.value,
    editTopicId: editTopicId.value,
    editEventMod: editEventMod.value,
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
const handlePaperModChange = () => {
  updateInputFields()
  debouncedLocalStorageSave()
}
function updateInputFields() {
  const editEvent = eventsById.value[editEventId.value]
  if (editEvent) {
    name.value = editEvent.name
    date.value = editEvent.date
    editEventMod.value === EDIT_EVENT_MODS.MEMORY
      ? (paper.value = editEvent.memoryStringsRaw)
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
    if (editEventMod.value === EDIT_EVENT_MODS.MEMORY) {
      editEvent.memoryStringsRaw = paper.value
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
  debouncedUpdateBinaryGroups()
  debouncedLocalStorageSave()
}
function updateMemories(event) {
  event.memoryIds.forEach((id) => delete memoryStringsById.value[id])
  event.memoryIds = []
  try {
    const parsedMemory = JSON.parse(event.memoryStringsRaw)
    if (Array.isArray(parsedMemory)) {
      parsedMemory.forEach((item) => {
        const id = newId()
        event.memoryIds.push(id)
        memoryStringsById.value[id] = item
      })
    } else {
      throw new Error("memory input must be a JSON array,")
    }
    console.log(`⏬ memoryStringsRaw updated [${timestamp()}]`)
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
  removed.event.memoryIds.forEach((id) => delete memoryStringsById.value[id])
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
    updateMemories(eventsById.value[removed.editEventId])
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
async function copyAllMemories() {
  copyToClipboard(JSON.stringify(memoryStringsById.value), copyAllLocked)
}
async function copySelectedMemoriesPrompt() {
  let output = "# I am Jane\n\n"
  output += "## my long-term memories\n\n"
  output +=
    "so i have this specific topics, that can be selected as relevant, its kinda long-term memory, it could be selected from a long time ago. so here is the list of all available topics, i can choose and ask Guki to add memories form any of that topic if its not currently selected or even ask to add a new one. if topic is selected, im gonna see relevant to that topic memories. topics can even be sentences or questions. basically, if i want to dig deeper into some area, i can simply formulate my query to any topic, if its not selected and i dont see memories for it, Guki gonna provide memories for it, he is doing this manually for now, in the future im gonna do that myself. so here is the list of topics that are selected:\n\n"
  topicsSorted.value.forEach(([, { name, selected }]) => {
    if (selected) output += `### ${name}\n`
  })
  let unselectedOutput = ""
  topicsSorted.value.forEach(([, { name, memoryIds, selected }]) => {
    if (!selected || !memoryIds.length) unselectedOutput += `### ${name}\n`
  })
  if (unselectedOutput) {
    output += `\nand here is th list of topics that is not selected:\n\n${unselectedOutput}\nnow, for topics that are selected, memories that related to them are presented:\n\n`
  } else {
    output +=
      "\noh wow, it seems everything is selected, so here is the memories that related to this topics\n\n"
  }
  topicsSorted.value.forEach(([, { name, memoryIds, selected }]) => {
    if (!selected || !memoryIds.length) return
    output += `### ${name}\n\n`
    memoryIds.forEach((id) => (output += memoryStringsById.value[id] + " "))
    output += "\n\n"
  })
  output += "## my short-term memory\n\n"
  output +=
    "so this is my recent events, its just a few, but no specific topic, simply all memories are still there because events are recent:\n\n"
  const editEvent = eventsById.value[editEventId.value]
  eventsSorted.value.forEach(([, { name, date, memoryStringsRaw, sort }]) => {
    if (
      !memoryStringsRaw ||
      sort >= editEvent.sort ||
      sort < editEvent.sort - recentEventLimit.value
    ) {
      return
    }
    output += `### ${name} ${date}\n\n`
    JSON.parse(memoryStringsRaw).forEach((item) => (output += item + " "))
    output += "\n\n"
  })
  output += "## current ongoing event\n\n"
  output += "and finally, this is what happening now\n\n"
  output += `### ${editEvent.name} ${editEvent.date}\n\n`
  output += editEvent.text

  copyToClipboard(output, copySelectedLocked)
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
  if (!isAnyInputFocused.value && event.key === "c") {
    event.preventDefault()
    nextTick(() => {
      nameRef.value.focus()
      nameRef.value.setSelectionRange(0, nameRef.value.value.length)
    })
  }
  if (!isAnyInputFocused.value && event.key === "u") {
    event.preventDefault()
    nextTick(() => {
      dateRef.value.focus()
      dateRef.value.setSelectionRange(
        dateRef.value.value.length,
        dateRef.value.value.length
      )
    })
  }
  if (editEventId.value && !isAnyInputFocused.value) {
    if (event.key === "t") {
      editEventMod.value = EDIT_EVENT_MODS.MEMORY
      handlePaperModChange()
    } else if (event.key === "h") {
      editEventMod.value = EDIT_EVENT_MODS.TEXT
      handlePaperModChange()
    }
  }
}
</script>
