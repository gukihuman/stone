<template>
  <div class="flex flex-col bg-stone-600 h-screen gap-3 p-1">
    <!-- main field -->
    <div class="flex overflow-hidden justify-between gap-3 flex-grow">
      <!-- events -->
      <div
        class="w-[250px] overflow-hidden flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg"
      >
        <!-- events top menu -->
        <div class="flex">
          <button
            @click="sortEventDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              editEventId === null || eventsById[editEventId].sort === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 rotate-90" />
          </button>
          <button
            @click="sortEventUp"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              editEventId === null ||
              eventsById[editEventId].sort === eventsSorted.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 -rotate-90" />
          </button>
          <button
            @click="createEvent()"
            class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
          >
            new
          </button>
          <div
            class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
          >
            {{ totalRecentMemories || "" }}
          </div>
        </div>
        <!-- event list -->
        <div ref="eventListRef" class="overflow-y-scroll pb-2">
          <div class="flex flex-col-reverse">
            <div
              v-for="[id, { name, memoryIds, sort }] in eventsSorted"
              :key="id"
            >
              <button
                class="flex w-full py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
                :class="
                  editEventId === id
                    ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                    : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                "
                @click="toggleEventEdit(id)"
              >
                <span class="truncate">{{ name }}</span>
                <div>
                  {{ memoryIds.length || "" }}
                </div>
              </button>
              <div
                v-if="
                  editEventId &&
                  sort ===
                    Math.max(
                      eventsById[editEventId].sort - RECENT_EVENT_LIMIT,
                      0
                    )
                "
                class="-mb-[2px] h-[2px] w-full bg-gradient-to-r from-stone-400 to-transparent"
              ></div>
            </div>
          </div>
        </div>
      </div>
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
          <Paper
            v-model="paper"
            @input="updateOnInput"
            :update="`${editEventMod}${editEventId}${editTopicId}`"
            :theme="
              editTopicId || editEventMod === EDIT_EVENT_MODS.MEMORY
                ? 'dark'
                : 'light'
            "
          />
        </div>
        <!-- edit buttons -->
        <div class="flex w-full p-3 bg-stone-700 justify-between">
          <!-- mod buttons -->
          <Switch
            v-if="editEventId"
            v-model="editEventMod"
            :labels="editEventModLabels"
            @change="handlePaperModChange"
          />
          <div class="flex gap-2">
            <Button
              v-if="editEventId"
              @click="copySelectedMemoriesPrompt"
              :disabled="copySelectedLocked"
            >
              copy {{ totalRecentMemories + totalTopicMemories }}
              {{ (totalRecentMemories + totalTopicMemories) * AVERAGE_TOKENS }}
            </Button>
            <Button @click="editEventId ? removeEvent() : removeTopic()"
              >remove
            </Button>
          </div>
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
              <button
                v-for="[id, { name, memoryIds, selected }] in topicsSorted"
                :key="id"
                class="flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
                :class="
                  topicMod === TOPIC_MODS.EDIT
                    ? editTopicId === id
                      ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                      : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                    : selected
                    ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                    : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                "
                @click="
                  topicMod === TOPIC_MODS.SELECT
                    ? toggleTopicSelect(id)
                    : toggleTopicEdit(id)
                "
              >
                <span class="truncate">{{ name }}</span>
                <div>
                  {{ memoryIds.length || "" }}
                </div>
              </button>
            </div>
          </div>
        </div>
        <Switch
          v-model="topicMod"
          :labels="topicModLabels"
          @change="handleTopicModChange"
          class="self-center w-full"
        />
      </div>
    </div>
    <!-- menu -->
    <div class="rounded-lg overflow-hidden flex-shrink-0">
      <button
        @click="copyAllMemories"
        class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
        :class="
          copyAllLocked
            ? 'cursor-default text-stone-500/60'
            : 'hover:bg-stone-800 hover:text-stone-300'
        "
      >
        copy {{ totalMemories }}
        {{ totalMemories * AVERAGE_JSON_TOKENS + BASE_PROMPT_TOKENS }}
      </button>
      <button
        @click="fileSave('stone.json', getStorage())"
        class="bg-stone-700 w-full justify-self-end text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        save
      </button>
      <button
        @click="onFileLoad"
        class="bg-stone-700 w-full justify-self-end text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        load
      </button>
      <button
        @click="restore"
        class="w-full bg-stone-700 justify-self-end pb-1"
        :class="
          removed
            ? 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            : 'cursor-default text-stone-500/80'
        "
      >
        restore
      </button>
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
const RECENT_EVENT_LIMIT = 10
const EDIT_EVENT_MODS = { TEXT: 0, MEMORY: 1 }
const TOPIC_MODS = { SELECT: 0, EDIT: 1 }

const editEventMod = ref(EDIT_EVENT_MODS.TEXT)
const editEventModLabels = {
  text: EDIT_EVENT_MODS.TEXT,
  memory: EDIT_EVENT_MODS.MEMORY,
}
const topicMod = ref(TOPIC_MODS.SELECT)
const topicModLabels = {
  select: TOPIC_MODS.SELECT,
  edit: TOPIC_MODS.EDIT,
}

const eventListRef = ref(null)
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
  const activeEvent = eventsById.value[editEventId.value]
  if (!activeEvent) return
  return Object.values(eventsById.value).reduce((sum, e) => {
    if (
      activeEvent.sort > e.sort &&
      e.sort >= Math.max(activeEvent.sort - RECENT_EVENT_LIMIT, 0)
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
  topicMod.value = storage.topicMod
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
    topicMod: topicMod.value,
  }
}
function createEvent() {
  const id = newId()
  eventsById.value[id] = {
    name: "current",
    date: new Date().toLocaleDateString(),
    text: "",
    memoryStringsRaw: "", // valid JSON array of strings as string itself
    memoryIds: [],
    sort: Object.keys(eventsById.value).length,
  }
  toggleEventEdit(id)
  nextTick(() => scrollToTop(eventListRef.value))
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
  if (topicMod.value === TOPIC_MODS.EDIT) toggleTopicEdit(id)
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
const handleTopicModChange = (newValue) => {
  if (newValue === TOPIC_MODS.SELECT) editTopicId.value = null
  debouncedLocalStorageSave()
}
function updateInputFields() {
  const activeEvent = eventsById.value[editEventId.value]
  if (activeEvent) {
    name.value = activeEvent.name
    date.value = activeEvent.date
    editEventMod.value === EDIT_EVENT_MODS.MEMORY
      ? (paper.value = activeEvent.memoryStringsRaw)
      : (paper.value = activeEvent.text)
  }
  const activeTopic = topicsById.value[editTopicId.value]
  if (activeTopic) {
    name.value = activeTopic.name
    paper.value = activeTopic.memoryIdsRaw
  }
}
function updateOnInput() {
  const activeEvent = eventsById.value[editEventId.value]
  if (activeEvent) {
    activeEvent.name = name.value
    activeEvent.date = date.value
    if (editEventMod.value === EDIT_EVENT_MODS.MEMORY) {
      activeEvent.memoryStringsRaw = paper.value
      debouncedUpdateMemories(activeEvent)
    } else {
      activeEvent.text = paper.value
    }
  }
  const activeTopic = topicsById.value[editTopicId.value]
  if (activeTopic) {
    activeTopic.name = name.value
    activeTopic.memoryIdsRaw = paper.value
    debouncedUpdateTopics(activeTopic)
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
function sortEventUp() {
  swapSort(eventsById.value, editEventId.value, 1)
  debouncedLocalStorageSave()
}
function sortEventDown() {
  swapSort(eventsById.value, editEventId.value, -1)
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
  const activeEvent = eventsById.value[editEventId.value]
  eventsSorted.value.forEach(([, { name, date, memoryStringsRaw, sort }]) => {
    if (
      !memoryStringsRaw ||
      sort >= activeEvent.sort ||
      sort < activeEvent.sort - RECENT_EVENT_LIMIT
    ) {
      return
    }
    output += `### ${name} ${date}\n\n`
    JSON.parse(memoryStringsRaw).forEach((item) => (output += item + " "))
    output += "\n\n"
  })
  output += "## current ongoing event\n\n"
  output += "and finally, this is what happening now\n\n"
  output += `### ${activeEvent.name} ${activeEvent.date}\n\n`
  output += activeEvent.text

  copyToClipboard(output, copySelectedLocked)
}
async function onFileLoad() {
  await fileLoad(injectStorage)
  debouncedLocalStorageSave()
}
function onKeyDown(event) {
  if (!editEventId.value) return
  if (event.key === "t") {
    editEventMod.value = EDIT_EVENT_MODS.MEMORY
    handlePaperModChange()
  } else if (event.key === "h") {
    editEventMod.value = EDIT_EVENT_MODS.TEXT
    handlePaperModChange()
  }
}
</script>
