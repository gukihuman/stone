<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div class="w-[250px] flex flex-col gap-1">
      <div
        class="flex flex-col flex-grow bg-circles bg-stone-500 rounded-lg overflow-hidden"
      >
        <div class="flex">
          <button
            @click="moveTextDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              eventId === null || event.sort === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 rotate-90" />
          </button>
          <button
            @click="moveTextUp"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              eventId === null || event.sort === eventListSorted.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 -rotate-90" />
          </button>
          <button
            @click="createText()"
            class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
          >
            new
          </button>
          <div
            class="bg-stone-700 text-stone-400 w-32 text-end pr-2 pt-[1px] cursor-default"
          >
            {{ Object.keys(memoryList).length * AVERAGE_TOKENS || "" }}
          </div>
          <div
            class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
          >
            {{ Object.keys(memoryList).length || "" }}
          </div>
        </div>
        <div ref="eventListRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="[id, { name, memoryLength }] in eventListSorted"
              class="flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
              :class="
                eventId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
              "
              @click="toggleText(id)"
            >
              <span class="truncate">{{ name }}</span>
              <div>
                {{ memoryLength }}
              </div>
            </button>
          </div>
        </div>
      </div>
      <div class="rounded-lg overflow-hidden flex-shrink-0">
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
    <div class="flex flex-col flex-grow">
      <div
        class="flex flex-col flex-grow overflow-hidden rounded-lg"
        v-if="eventId || topicId"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <input
            type="text"
            v-model="name"
            @input="onInput"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
          />
          <input
            v-if="eventId"
            type="text"
            v-model="time"
            @input="onInput"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-stone-300 truncate hover:bg-stone-800"
          />
        </div>
        <button
          v-if="eventId"
          @click="copyToClipboard"
          class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
          :class="
            recentlyCopied
              ? 'cursor-default text-stone-500/60'
              : 'hover:bg-stone-800 hover:text-stone-300'
          "
        >
          copy
        </button>
        <div v-if="eventId" class="flex">
          <button
            @click="setPaperToText"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activePaperType === PAPER_TYPES.TEXT
                ? 'cursor-default text-stone-500/60'
                : 'hover:bg-stone-800 hover:text-stone-300'
            "
          >
            text
          </button>
          <button
            @click="setPaperToMemory"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activePaperType === PAPER_TYPES.MEMORY
                ? 'cursor-default text-stone-500/60'
                : 'hover:bg-stone-800 hover:text-stone-300'
            "
          >
            memory
          </button>
        </div>
        <textarea
          ref="paperRef"
          v-model="paper"
          @input="onInput"
          @scroll="onTextScroll"
          class="h-full bg-lines scroll-light bg-stone-400 pt-7 pb-7 p-8 resize-none text-stone-800 text-xl"
          :style="{ backgroundPositionY }"
        ></textarea>
        <button
          @click="eventId ? removeText() : removeTopic()"
          class="max-h-7 w-full bg-stone-700 justify-self-end text-stone-400 pb-1 hover:bg-stone-800 self-end hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <div class="w-[250px] flex flex-col gap-1">
      <div class="flex-grow bg-circles bg-stone-500 rounded-lg overflow-hidden">
        <div class="flex">
          <button
            @click="moveTopicDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              topicId === null || topic.sort === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 rotate-90" />
          </button>
          <button
            @click="moveTopicUp"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              topicId === null || topic.sort === topicListSorted.length - 1
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
            class="bg-stone-700 text-stone-400 w-32 text-end pr-2 pt-[1px] cursor-default"
          >
            {{ totalTopicMemoryTokens || "" }}
          </div>
          <div
            class="bg-stone-700 text-stone-400 w-20 text-end pr-2 pt-[1px] cursor-default"
          >
            {{ totalTopicMemories || "" }}
          </div>
        </div>
        <div ref="topicListRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="[id, { name, memoryLength }] in topicListSorted"
              class="flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
              :class="
                topicId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
              "
              @click="toggleTopic(id)"
            >
              <span class="truncate">{{ name }}</span>
              <div>
                {{ memoryLength }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash"
import fileSave from "./utils/fileSave"
import fileLoad from "./utils/fileLoad"
import newId from "./utils/newId"
import timestamp from "./utils/timestamp"
import { onMounted } from "vue"
const LOCAL_STORAGE_KEY = "stone"
const AVERAGE_TOKENS = 42
const COPY_DELAY = 200
const eventListRef = ref(null)
const paperRef = ref(null)
const topicListRef = ref(null)

const eventList = ref({})
const memoryList = ref({})
const topicList = ref({})
const eventId = ref(null)
const topicId = ref(null)

// handle v-model fields to edit
const name = ref("")
const time = ref("")
const paper = ref("")

const PAPER_TYPES = { TEXT: 0, MEMORY: 1, TOPIC: 2 }
const activePaperType = ref(PAPER_TYPES.TEXT)

let removed = null

const recentlyCopied = ref(false)
const backgroundPositionY = ref("0px")
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 300)
const debouncedUpdateMemoryList = _.debounce(updateMemoryList, 300)
const debouncedUpdateTopicList = _.debounce(updateTopicList, 300)

const event = computed(() => eventList.value[eventId.value])
const topic = computed(() => topicList.value[topicId.value])
const eventListSorted = computed(() => {
  return Object.entries(eventList.value).sort(([, a], [, b]) => a.sort - b.sort)
})
const topicListSorted = computed(() => {
  return Object.entries(topicList.value).sort(([, a], [, b]) => a.sort - b.sort)
})
const totalTopicMemories = computed(() => {
  return Object.values(topicList.value).reduce((sum, topic) => {
    return sum + topic.memoryIds.length
  }, 0)
})
const totalTopicMemoryTokens = computed(() => {
  return totalTopicMemories.value * AVERAGE_TOKENS
})

onMounted(loadLocalStorageItem)

function createText() {
  const id = newId()
  eventList.value[id] = {
    name: "current",
    time: new Date().toLocaleDateString(),
    text: "",
    memory: "", // valid JSON array
    memoryIds: [],
    memoryLength: null,
    sort: Object.keys(eventList.value).length,
  }
  toggleText(id)
  nextTick(() => {
    paperRef.value.focus()
    scrollToTop(eventListRef)
  })
}
function createTopic() {
  const id = newId()
  topicList.value[id] = {
    name: "topic",
    memoryIdsRaw: "", // valid JSON array
    memoryIds: [],
    memoryLength: null,
    sort: Object.keys(topicList.value).length,
  }
  toggleTopic(id)
  nextTick(() => scrollToTop(topicListRef))
}
function toggleText(id) {
  activePaperType.value = PAPER_TYPES.TEXT
  if (eventId.value === id) eventId.value = null
  else eventId.value = id
  topicId.value = null
  onTextScroll()
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleTopic(id) {
  activePaperType.value = PAPER_TYPES.TOPIC
  if (topicId.value === id) topicId.value = null
  else topicId.value = id
  eventId.value = null
  onTextScroll()
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function setPaperToMemory() {
  if (activePaperType.value === PAPER_TYPES.MEMORY) return
  activePaperType.value = PAPER_TYPES.MEMORY
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function setPaperToText() {
  if (activePaperType.value === PAPER_TYPES.TEXT) return
  activePaperType.value = PAPER_TYPES.TEXT
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function updateInputFields() {
  const eventCache = event.value
  if (eventCache) {
    name.value = eventCache.name
    time.value = eventCache.time
    activePaperType.value === PAPER_TYPES.MEMORY
      ? (paper.value = eventCache.memory)
      : (paper.value = eventCache.text)
  }
  const topicCache = topic.value
  if (topicCache) {
    name.value = topicCache.name
    paper.value = topicCache.memoryIdsRaw
  }
}
function onInput() {
  const eventCache = event.value
  if (eventCache) {
    eventCache.name = name.value
    eventCache.time = time.value
    if (activePaperType.value === PAPER_TYPES.MEMORY) {
      eventCache.memory = paper.value
      debouncedUpdateMemoryList(eventCache)
    } else {
      eventCache.text = paper.value
    }
  }
  const topicCache = topic.value
  if (topicCache) {
    topicCache.name = name.value
    topicCache.memoryIdsRaw = paper.value
    debouncedUpdateTopicList(topicCache)
  }
  debouncedSaveLocalStorageItem()
}
function updateMemoryList(event) {
  event.memoryIds.forEach((id) => delete memoryList.value[id])
  event.memoryIds = []
  event.memoryLength = null
  try {
    const parsedMemory = JSON.parse(event.memory)
    if (Array.isArray(parsedMemory)) {
      parsedMemory.forEach((item) => {
        const id = newId()
        event.memoryIds.push(id)
        memoryList.value[id] = item
      })
      event.memoryLength = parsedMemory.length
    } else {
      throw new Error("memory input must be a JSON array,")
    }
    console.log(`⏬ memory updated! [${timestamp()}]`)
  } catch (error) {
    const resetString = "memory of this event has been reset"
    if (error instanceof SyntaxError) {
      console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
    } else {
      console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
    }
  }
}
function updateTopicList(topic) {
  topic.memoryIds = []
  topic.memoryLength = null
  try {
    const parsedMemoryIds = JSON.parse(topic.memoryIdsRaw)
    if (Array.isArray(parsedMemoryIds)) {
      topic.memoryIds = parsedMemoryIds
      topic.memoryLength = parsedMemoryIds.length
    } else {
      throw new Error("topic input must be a JSON array,")
    }
    console.log(`⏬ topic updated! [${timestamp()}]`)
  } catch (error) {
    const resetString = "topic has been reset"
    if (error instanceof SyntaxError) {
      console.log(`❗ invalid JSON format, ${resetString} [${timestamp()}]`)
    } else {
      console.log(`❗ ${error.message} ${resetString} [${timestamp()}]`)
    }
  }
}
function removeText() {
  removed = {}
  const id = eventId.value
  removed.event = event.value
  removed.eventId = id
  toggleText(id)
  delete eventList.value[id]
  Object.values(eventList.value).forEach((event) => {
    if (event.sort > removed.event.sort) event.sort--
  })
  removed.event.memoryIds.forEach((id) => delete memoryList.value[id])
}
function removeTopic() {
  removed = {}
  const id = topicId.value
  removed.topic = topic.value
  removed.topicId = id
  toggleTopic(id)
  delete topicList.value[id]
  Object.values(topicList.value).forEach((topic) => {
    if (topic.sort > removed.topic.sort) topic.sort--
  })
}
function restore() {
  if (!removed) return
  if (removed.event) {
    eventList.value[removed.eventId] = {
      ...removed.event,
      sort: Object.keys(eventList.value).length,
    }
    toggleText(removed.eventId)
    updateMemoryList(eventList.value[removed.eventId])
  } else {
    topicList.value[removed.topicId] = {
      ...removed.topic,
      sort: Object.keys(topicList.value).length,
    }
    toggleTopic(removed.topicId)
  }
  removed = null
  debouncedSaveLocalStorageItem()
}
function move(obj, id, item, step) {
  if (!id) return
  const target = Object.entries(obj).find(
    ([, target]) => target.sort === item.sort + step
  )?.[1]
  if (!target) return
  target.sort = target.sort - step
  item.sort = item.sort + step
  debouncedSaveLocalStorageItem()
}
function moveTextUp() {
  move(eventList.value, eventId.value, event.value, 1)
}
function moveTextDown() {
  move(eventList.value, eventId.value, event.value, -1)
}
function moveTopicUp() {
  move(topicList.value, topicId.value, topic.value, 1)
}
function moveTopicDown() {
  move(topicList.value, topicId.value, topic.value, -1)
}
function getStorage() {
  return {
    eventList: eventList.value,
    eventId: eventId.value,
    topicList: topicList.value,
    topicId: topicId.value,
    memoryList: memoryList.value,
    activePaperType: activePaperType.value,
  }
}
function saveLocalStorageItem() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getStorage()))
}
function loadLocalStorageItem() {
  const rawStorage = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (rawStorage) injectStorage(JSON.parse(rawStorage))
}
function injectStorage(storage) {
  eventList.value = storage.eventList
  eventId.value = storage.eventId
  topicList.value = storage.topicList
  topicId.value = storage.topicId
  activePaperType.value = storage.activePaperType
  memoryList.value = storage.memoryList
  updateInputFields()
}
function onTextScroll(event) {
  if (!event) {
    backgroundPositionY.value = 0
    return
  }
  backgroundPositionY.value = `-${event.target.scrollTop}px`
}
function scrollToTop(ref) {
  ref.value.scrollTop = ref.value.clientHeight - ref.value.scrollHeight
}
async function copyToClipboard() {
  if (recentlyCopied.value) return
  recentlyCopied.value = true
  setTimeout(() => (recentlyCopied.value = false), COPY_DELAY)
  let output = ""
  _.forEach(eventList.value, ({ name, time, memory, sort }) => {
    if (sort >= event.value.sort) return
    output += time + "\n"
    output += name + "\n\n"
    JSON.parse(memory).forEach((item) => (output += item + "\n"))
    output += "\n---\n"
  })
  output += event.value.time + "\n"
  output += event.value.name + "\n\n"
  output += event.value.text
  try {
    await navigator.clipboard.writeText(output)
    console.log(`⏬ copied! [${timestamp()}]`)
  } catch (err) {
    console.error("Failed to copy:", err)
  }
}
async function onFileLoad() {
  await fileLoad(injectStorage)
  debouncedSaveLocalStorageItem()
}
</script>
