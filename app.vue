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
        :recent-event-limit="RECENT_EVENT_LIMIT"
        @toggle-event-edit="toggleEventEdit"
        @local-storage-save="debouncedLocalStorageSave"
      />
      <!-- paper and buttons -->
      <div
        class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
        v-if="editEventId || editTopicId"
      >
        <!-- paper block with name and date -->
        <div class="w-full flex flex-col flex-grow">
          <div class="flex min-h-11 rounded-t-lg overflow-hidden">
            <input
              type="text"
              v-model="name"
              @input="updateOnInput"
              class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
            />
            <input
              v-if="editEventId"
              type="text"
              v-model="date"
              @input="updateOnInput"
              class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-stone-300 truncate hover:bg-stone-800"
            />
          </div>
          <!-- paper -->
          <Paper
            v-model="paper"
            @input="updateOnInput"
            @focus="isPaperFocused = true"
            @blur="isPaperFocused = false"
            :update="`${editEventMod}${editEventId}${editTopicId}`"
            :theme="
              editTopicId || editEventMod === EDIT_EVENT_MODS.MEMORY
                ? 'dark'
                : 'light'
            "
          />
        </div>
        <!-- edit buttons -->
        <div
          class="flex w-full p-3 bg-stone-700"
          :class="editEventId ? 'justify-between' : 'justify-end'"
        >
          <!-- paper mod buttons -->
          <Switch
            v-if="editEventId"
            v-model="editEventMod"
            :labels="editEventModLabels"
            @change="handlePaperModChange"
          />
          <Button
            v-if="editEventId"
            @click="copySelectedMemoriesPrompt"
            :disabled="copySelectedLocked"
            theme="light"
          >
            copy {{ totalRecentMemories + totalTopicMemories }}
            {{ (totalRecentMemories + totalTopicMemories) * AVERAGE_TOKENS }}
          </Button>
          <Button
            @click="editEventId ? removeEvent() : removeTopic()"
            theme="light"
            >remove
          </Button>
        </div>
      </div>
      <!-- topics -->
      <div class="w-[250px] flex flex-col gap-3">
        <div
          class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg overflow-hidden"
        >
          <!-- topics top menu -->
          <div class="flex">
            <button
              @click="sortTopicDown"
              class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
              :class="
                editTopicId === null || topicsById[editTopicId].sort === 0
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <IconArrow class="w-3 rotate-90" />
            </button>
            <button
              @click="sortTopicUp"
              class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
              :class="
                editTopicId === null ||
                topicsById[editTopicId].sort === topicsSorted.length - 1
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <IconArrow class="w-3 -rotate-90" />
            </button>
            <button
              @click="createTopic()"
              class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
            >
              new
            </button>
            <div
              class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
            >
              {{ totalTopicMemories || "" }}
            </div>
          </div>
          <!-- topic list -->
          <div ref="topicListRef" class="flex-grow overflow-auto pb-2">
            <div class="flex flex-col-reverse">
              <div
                class="flex max-w-full"
                v-for="[id, { name, memoryIds, selected }] in topicsSorted"
                :key="id"
              >
                <button
                  class="flex-grow overflow-hidden flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
                  :class="
                    editTopicId === id
                      ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                      : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                  "
                  @click="toggleTopicEdit(id)"
                >
                  <span class="truncate">{{ name }}</span>
                  {{ memoryIds.length || "" }}
                </button>
                <div
                  class="flex-shrink-0 flex items-center justify-center cursor-pointer px-1"
                  @click="toggleTopicSelect(id)"
                >
                  <div
                    class="flex items-center justify-center rounded-full size-5 bg-stone-600"
                  >
                    <div
                      class="rounded-full size-3"
                      :class="[selected ? 'bg-stone-400' : 'bg-stone-600']"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- main bottom menu -->
    <div
      class="flex flex-col items-center rounded-lg overflow-hidden flex-shrink-0"
    >
      <div class="w-fit rounded-lg overflow-hidden">
        <Button @click="copyAllMemories" theme="dark" :disabled="copyAllLocked">
          copy {{ totalMemories }}
          {{ totalMemories * AVERAGE_JSON_TOKENS + BASE_PROMPT_TOKENS }}
        </Button>
        <Button @click="fileSave('stone.json', getStorage())" theme="dark">
          save
        </Button>
        <Button @click="onFileLoad" theme="dark"> load </Button>
        <Button @click="restore" theme="dark" :disabled="!removed">
          restore
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { encode } from "gpt-tokenizer"
import fileSave from "./utils/fileSave"
import fileLoad from "./utils/fileLoad"
import newId from "./utils/newId"
import timestamp from "./utils/timestamp"
import swapSort from "./utils/swapSort"
import copyToClipboard from "./utils/copyToClipboard"
import debounce from "./utils/debounce"
import scrollToTop from "./utils/scrollToTop"
import { nextTick } from "vue"

const APP_LOCAL_STORAGE_KEY = "stone"
const DEBOUNCE_DELAY = 300
const AVERAGE_TOKENS = 50
const AVERAGE_JSON_TOKENS = 60
const BASE_PROMPT_TOKENS = 5700
const RECENT_EVENT_LIMIT = 5
const EDIT_EVENT_MODS = { TEXT: 0, MEMORY: 1 }

const editEventMod = ref(EDIT_EVENT_MODS.TEXT)
const editEventModLabels = {
  text: EDIT_EVENT_MODS.TEXT,
  memory: EDIT_EVENT_MODS.MEMORY,
}

const topicListRef = ref(null)

const memoryStringsById = ref({}) // main memory storage
const eventsById = ref({})
const topicsById = ref({})
const editEventId = ref(null)
const editTopicId = ref(null)

// handle v-model fields to edit
const name = ref("")
const date = ref("")
const paper = ref("")

let removed = null

const copySelectedLocked = ref(false)
const copyAllLocked = ref(false)
const isPaperFocused = ref(false)

const debouncedLocalStorageSave = debounce(localStorageSave, DEBOUNCE_DELAY)
const debouncedUpdateMemories = debounce(updateMemories, DEBOUNCE_DELAY)
const debouncedUpdateTopics = debounce(updateTopics, DEBOUNCE_DELAY)

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
      e.sort >= Math.max(editEvent.sort - RECENT_EVENT_LIMIT, 0)
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
  if (editEventId.value) {
    const text = eventsById.value[editEventId.value].text
    try {
      const tokenCount = encode(text).length
      console.log(`Tokens in current event text: ${tokenCount}`)
    } catch (error) {
      console.error("Error counting tokens:", error)
    }
  }
}
function injectStorage(storage) {
  memoryStringsById.value = storage.memoryStringsById
  eventsById.value = storage.eventsById
  topicsById.value = storage.topicsById
  editEventId.value = storage.editEventId
  editTopicId.value = storage.editTopicId
  editEventMod.value = storage.editEventMod
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
  }
}
function createTopic() {
  const id = newId()
  topicsById.value[id] = {
    name: "topic",
    memoryIdsRaw: "", // valid JSON array of numbers as string itself
    memoryIds: [],
    selected: true,
    sort: Object.keys(topicsById.value).length,
  }
  toggleTopicEdit(id)
  nextTick(() => scrollToTop(topicListRef.value))
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
function toggleTopicSelect(id) {
  topicsById.value[id].selected = !topicsById.value[id].selected
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
function sortTopicUp() {
  swapSort(topicsById.value, editTopicId.value, 1)
  debouncedLocalStorageSave()
}
function sortTopicDown() {
  swapSort(topicsById.value, editTopicId.value, -1)
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
      sort < editEvent.sort - RECENT_EVENT_LIMIT
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
  if (!editEventId.value || isPaperFocused.value) return
  if (event.key === "t") {
    editEventMod.value = EDIT_EVENT_MODS.MEMORY
    handlePaperModChange()
  } else if (event.key === "h") {
    editEventMod.value = EDIT_EVENT_MODS.TEXT
    handlePaperModChange()
  }
}
</script>
