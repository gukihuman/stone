<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div class="w-[250px] flex flex-col gap-1">
      <div
        class="flex flex-col flex-grow bg-circles bg-stone-500 rounded-lg overflow-hidden"
      >
        <div class="flex">
          <button
            @click="sortEventDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              activeEventId === null || eventsById[activeEventId].sort === 0
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
              activeEventId === null ||
              eventsById[activeEventId].sort === eventsSorted.length - 1
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
        <div ref="eventListRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <div v-for="[id, { name, memoryIds, sort }] in eventsSorted">
              <button
                class="flex w-full py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
                :class="
                  activeEventId === id
                    ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                    : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                "
                @click="toggleEvent(id)"
              >
                <span class="truncate">{{ name }}</span>
                <div>
                  {{ memoryIds.length || "" }}
                </div>
              </button>
              <div
                v-if="
                  activeEventId &&
                  sort ===
                    Math.max(
                      eventsById[activeEventId].sort - RECENT_EVENT_LIMIT,
                      0
                    )
                "
                class="-mb-[2px] h-[2px] w-full bg-stone-400"
              ></div>
            </div>
          </div>
        </div>
      </div>
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
    <div class="flex flex-col flex-grow">
      <div
        class="flex flex-col flex-grow overflow-hidden rounded-lg"
        v-if="activeEventId || activeTopicId"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <input
            type="text"
            v-model="name"
            @input="onInput"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
          />
          <input
            v-if="activeEventId"
            type="text"
            v-model="date"
            @input="onInput"
            class="h-full w-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-stone-300 truncate hover:bg-stone-800"
          />
        </div>
        <button
          v-if="activeEventId"
          @click="copySelectedMemoriesPrompt"
          class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
          :class="
            copySelectedLocked
              ? 'cursor-default text-stone-500/60'
              : 'hover:bg-stone-800 hover:text-stone-300'
          "
        >
          copy {{ totalRecentMemories + totalTopicMemories }}
          {{ (totalRecentMemories + totalTopicMemories) * AVERAGE_TOKENS }}
        </button>
        <div v-if="activeEventId" class="flex">
          <button
            @click="setPaperMod(PAPER_MODS.TEXT)"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activePaperMod === PAPER_MODS.TEXT
                ? 'cursor-default text-stone-500/60'
                : 'hover:bg-stone-800 hover:text-stone-300'
            "
          >
            text
          </button>
          <button
            @click="setPaperMod(PAPER_MODS.MEMORY)"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activePaperMod === PAPER_MODS.MEMORY
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
          @click="activeEventId ? removeEvent() : removeTopic()"
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
            @click="sortTopicDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              activeTopicId === null || topicsById[activeTopicId].sort === 0
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
              activeTopicId === null ||
              topicsById[activeTopicId].sort === topicsSorted.length - 1
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
        <div class="flex">
          <button
            @click="setTopicModToSelect"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activeTopicMod === TOPIC_MODS.SELECT
                ? 'cursor-default text-stone-500/60'
                : 'hover:bg-stone-800 hover:text-stone-300'
            "
          >
            select
          </button>
          <button
            @click="setTopicModToEdit"
            class="w-full justify-self-end pb-1 self-end text-stone-400 bg-stone-700"
            :class="
              activeTopicMod === TOPIC_MODS.EDIT
                ? 'cursor-default text-stone-500/60'
                : 'hover:bg-stone-800 hover:text-stone-300'
            "
          >
            edit
          </button>
        </div>
        <div ref="topicListRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="[id, { name, memoryIds, selected }] in topicsSorted"
              class="flex py-[2px] text-left min-h-7 text-shadow outline-none text-stone-200 pr-2 gap-2 justify-between"
              :class="
                activeTopicMod === TOPIC_MODS.EDIT
                  ? activeTopicId === id
                    ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                    : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
                  : selected
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
              "
              @click="
                activeTopicMod === TOPIC_MODS.SELECT
                  ? toggleTopicSelect(id)
                  : toggleTopicActive(id)
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
    </div>
  </div>
</template>
<script setup>
import fileSave from "./utils/fileSave"
import fileLoad from "./utils/fileLoad"
import newId from "./utils/newId"
import timestamp from "./utils/timestamp"
import swapSort from "./utils/swapSort"
import copyToClipboard from "./utils/copyToClipboard"
import debounce from "./utils/debounce"

const APP_LOCAL_STORAGE_KEY = "stone"
const DEBOUNCE_DELAY = 300
const AVERAGE_TOKENS = 50
const AVERAGE_JSON_TOKENS = 60
const BASE_PROMPT_TOKENS = 5700
const RECENT_EVENT_LIMIT = 10
const PAPER_MODS = { TEXT: 0, MEMORY: 1 }
const TOPIC_MODS = { SELECT: 0, EDIT: 1 }

const activePaperMod = ref(PAPER_MODS.TEXT)
const activeTopicMod = ref(TOPIC_MODS.SELECT)

const eventListRef = ref(null)
const paperRef = ref(null)
const topicListRef = ref(null)

const memoryStringsById = ref({}) // main memory storage
const eventsById = ref({})
const topicsById = ref({})
const activeEventId = ref(null)
const activeTopicId = ref(null)

// handle v-model fields to edit
const name = ref("")
const date = ref("")
const paper = ref("")

let removed = null

const copySelectedLocked = ref(false)
const copyAllLocked = ref(false)
const backgroundPositionY = ref("0px")

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
  const activeEvent = eventsById.value[activeEventId.value]
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

onMounted(localStorageLoad)

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
  activeEventId.value = storage.activeEventId
  activeTopicId.value = storage.activeTopicId
  activePaperMod.value = storage.activePaperMod
  activeTopicMod.value = storage.activeTopicMod
  updateInputFields()
}
function getStorage() {
  return {
    memoryStringsById: memoryStringsById.value,
    eventsById: eventsById.value,
    topicsById: topicsById.value,
    activeEventId: activeEventId.value,
    activeTopicId: activeTopicId.value,
    activePaperMod: activePaperMod.value,
    activeTopicMod: activeTopicMod.value,
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
  toggleEvent(id)
  nextTick(() => {
    paperRef.value.focus()
    scrollToTop(eventListRef)
  })
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
  if (activeTopicMod.value === TOPIC_MODS.EDIT) toggleTopicActive(id)
  nextTick(() => scrollToTop(topicListRef))
}
function toggleEvent(id) {
  activePaperMod.value = PAPER_MODS.TEXT
  if (activeEventId.value === id) activeEventId.value = null
  else activeEventId.value = id
  activeTopicId.value = null
  onTextScroll()
  updateInputFields()
  debouncedLocalStorageSave()
}
function toggleTopicActive(id) {
  if (activeTopicId.value === id) activeTopicId.value = null
  else activeTopicId.value = id
  activeEventId.value = null
  onTextScroll()
  updateInputFields()
  debouncedLocalStorageSave()
}
function toggleTopicSelect(id) {
  topicsById.value[id].selected = !topicsById.value[id].selected
  debouncedLocalStorageSave()
}
function setPaperMod(mod) {
  if (activePaperMod.value === mod) return
  activePaperMod.value = mod
  updateInputFields()
  debouncedLocalStorageSave()
}
function setTopicModToSelect() {
  if (activeTopicMod.value === TOPIC_MODS.SELECT) return
  activeTopicMod.value = TOPIC_MODS.SELECT
  activeTopicId.value = null
  debouncedLocalStorageSave()
}
function setTopicModToEdit() {
  if (activeTopicMod.value === TOPIC_MODS.EDIT) return
  activeTopicMod.value = TOPIC_MODS.EDIT
  debouncedLocalStorageSave()
}
function updateInputFields() {
  const activeEvent = eventsById.value[activeEventId.value]
  if (activeEvent) {
    name.value = activeEvent.name
    date.value = activeEvent.date
    activePaperMod.value === PAPER_MODS.MEMORY
      ? (paper.value = activeEvent.memoryStringsRaw)
      : (paper.value = activeEvent.text)
  }
  const activeTopic = topicsById.value[activeTopicId.value]
  if (activeTopic) {
    name.value = activeTopic.name
    paper.value = activeTopic.memoryIdsRaw
  }
}
function onInput() {
  const activeEvent = eventsById.value[activeEventId.value]
  if (activeEvent) {
    activeEvent.name = name.value
    activeEvent.date = date.value
    if (activePaperMod.value === PAPER_MODS.MEMORY) {
      activeEvent.memoryStringsRaw = paper.value
      debouncedUpdateMemories(activeEvent)
    } else {
      activeEvent.text = paper.value
    }
  }
  const activeTopic = topicsById.value[activeTopicId.value]
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
  const id = activeEventId.value
  removed.event = eventsById.value[activeEventId.value]
  removed.activeEventId = id
  toggleEvent(id)
  delete eventsById.value[id]
  Object.values(eventsById.value).forEach((event) => {
    if (event.sort > removed.event.sort) event.sort--
  })
  removed.event.memoryIds.forEach((id) => delete memoryStringsById.value[id])
}
function removeTopic() {
  removed = {}
  const id = activeTopicId.value
  removed.topic = topicsById.value[activeTopicId.value]
  removed.activeTopicId = id
  toggleTopicActive(id)
  delete topicsById.value[id]
  Object.values(topicsById.value).forEach((topic) => {
    if (topic.sort > removed.topic.sort) topic.sort--
  })
}
function restore() {
  if (!removed) return
  if (removed.event) {
    eventsById.value[removed.activeEventId] = {
      ...removed.event,
      sort: Object.keys(eventsById.value).length,
    }
    toggleEvent(removed.activeEventId)
    updateMemories(eventsById.value[removed.activeEventId])
  } else {
    topicsById.value[removed.activeTopicId] = {
      ...removed.topic,
      sort: Object.keys(topicsById.value).length,
    }
    toggleTopicActive(removed.activeTopicId)
  }
  removed = null
  debouncedLocalStorageSave()
}
function sortEventUp() {
  swapSort(eventsById.value, activeEventId.value, 1)
  debouncedLocalStorageSave()
}
function sortEventDown() {
  swapSort(eventsById.value, activeEventId.value, -1)
  debouncedLocalStorageSave()
}
function sortTopicUp() {
  swapSort(topicsById.value, activeTopicId.value, 1)
  debouncedLocalStorageSave()
}
function sortTopicDown() {
  swapSort(topicsById.value, activeTopicId.value, -1)
  debouncedLocalStorageSave()
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
  const activeEvent = eventsById.value[activeEventId.value]
  eventsSorted.value.forEach(([, { name, date, memoryStringsRaw, sort }]) => {
    if (
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
</script>
