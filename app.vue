<template>
  <div class="flex bg-stone-600 h-screen gap-2 p-1">
    <!-- # left col events files ---------------------------------------------->
    <div class="flex flex-col gap-2 w-[250px] flex-shrink-0">
      <Events
        :events="events"
        :focused-index="
          appState.focusedList === 'events' ? appState.focusedIndex : null
        "
        @new-event="newEvent"
        @toggle-focus="toggleEventFocus"
      />
      <Files
        ref="filesRef"
        v-if="files"
        :files="files"
        :path="appState.filesPath"
        :focused-i="
          appState.focusedList === 'files' ? appState.focusedIndex : null
        "
        @update-path="updateFilePath"
        @lock-hotkeys="() => (hotkeysLockedByInput = true)"
        @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
        @toggle-focus="toggleFileFocus"
      />
      <div v-else class="flex-1" />
    </div>
    <!-- # mid ---------------------------------------------------------------->
    <div class="flex w-full gap-2">
      <div class="flex flex-col gap-2 flex-grow justify-end">
        <div
          class="flex flex-col h-full"
          v-if="
            getFocusedEvent() ||
            getFocusedTopic() ||
            getFocusedFile() ||
            getFocusedShape()
          "
        >
          <FocusedEvent
            v-if="getFocusedEvent()"
            :key="`event-${appState.focusedIndex}-${appState.focusedField}-${appState.focusedEntity}-${updateFocused}`"
            ref="focusedRef"
            :event="getFocusedEvent()"
            :field="appState.focusedField"
            :fields="['text', 'memory']"
            :is-locked="isLocked"
            :focused-entity="appState.focusedEntity"
            @update-event="updateFocusedEvent"
            @remove-event="removeFocusedEvent"
            @update-app-state="
              (key, value) => appState.upsertDBSync(key, value)
            "
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <FocusedTopic
            ref="focusedRef"
            v-else-if="getFocusedTopic() !== null"
            :key="`topic-${appState.focusedIndex}-${appState.focusedEntity}`"
            :topic="getFocusedTopic()"
            :events="events"
            :focused-entity="appState.focusedEntity"
            @update-topic="updateFocusedTopic"
            @remove-topic="removeFocusedTopic"
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <FocusedFile
            ref="focusedRef"
            v-else-if="getFocusedFile() !== null"
            :key="`file-${appState.focusedIndex}`"
            :file="getFocusedFile()"
          />
          <FocusedShape
            ref="focusedRef"
            v-else-if="appState.focusedList === 'shapes' && getFocusedShape()"
            :key="`focused-shape-${appState.focusedIndex}-${appState.focusedEntity}`"
            :shapeName="getFocusedShape().name"
            :shapeDefinition="getFocusedShape().definition"
            @update-shape="handleUpdateShape"
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <Draft
            ref="focusedDraftRef"
            v-if="
              appState.draft !== undefined &&
              appState.focusedField === 'text' &&
              appState.focusedList === 'events'
            "
            :modelValue="appState.draft"
            @update:modelValue="
              (value) => appState.upsertDBSync('draft', value)
            "
            @append="appendDraftToEvent"
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <Spell
            v-if="
              appState.focusedField === 'text' &&
              appState.focusedList === 'events'
            "
            ref="focusedSpellRef"
            :events="events"
            :topics="topics"
            :shapes="shapes"
            :files="files"
            :app-state="appState"
            :focused-entity="appState.focusedEntity"
            :is-context-locked="isContextLocked"
            @context="onContext"
            @cast="onCast"
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2 w-[250px] flex-shrink-0">
        <div
          class="flex flex-col items-center rounded-lg overflow-hidden flex-shrink-0"
        >
          <div class="flex rounded-lg overflow-hidden w-full">
            <div class="flex-grow">
              <ButtonDark
                @click="restoreEvent"
                theme="dark"
                :disabled="!lastRemovedEvent"
                class="w-full"
              >
                restore
              </ButtonDark>
            </div>
            <div class="flex-grow">
              <ButtonDark @click="onFileSave" class="w-full"> save </ButtonDark>
            </div>
            <div class="flex-grow">
              <ButtonDark @click="onFileLoad" class="w-full" theme="dark">
                load
              </ButtonDark>
            </div>
          </div>
        </div>
        <Switch
          :model-value="appState.focusedEntity"
          :states="entities"
          @update:modelValue="onEntitySwitch"
          theme="dark"
          class="w-full"
        />
        <Topics
          :topics="topics[appState.focusedEntity] || []"
          :events="events"
          :focused-index="
            appState.focusedList === 'topics' ? appState.focusedIndex : null
          "
          :focused-entity="appState.focusedEntity"
          @new-topic="newTopic"
          @toggle-focus="toggleTopicFocus"
          @sort-up="sortTopic(1)"
          @sort-down="sortTopic(-1)"
        />
        <Shapes
          :shapes="shapes[appState.focusedEntity] || {}"
          :focused-index="
            appState.focusedList === 'shapes' ? appState.focusedIndex : null
          "
          @toggle-focus="toggleShapeFocus"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// for cast
import getTokens from "/utils/getTokens"

const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()
const { entities, events, topics, shapes, appState } = useDatabase()

// els refs
const focusedRef = ref(null)
const focusedDraftRef = ref(null)
const focusedSpellRef = ref(null)
const filesRef = ref(null)

// reactive
const files = ref(null)
const isLocked = reactive({
  copy: { text: false, name: false, memory: false },
  gen: { text: false, name: false, memory: false },
})
const updateFocused = ref(0)
const isContextLocked = {
  full: ref(false),
  mini: ref(false),
  custom: ref(false),
}

// regular
let lastRemovedEvent = null
let cleanupHotkeys
const hotkeys = {
  // left hand
  w: () => toggleEventFocus(events.length - 1),
  y: () => switchToNextEntity(),

  q: () => appendDraftToEvent(),
  c: () => focusedRef.value?.focusName(),
  u: () => focusedRef.value?.focus(),
  e: () => focusedDraftRef.value?.focus(),
  o: () => focusedSpellRef.value?.focus(),

  b: () => filesRef.value?.focusPath(),
  g: () => scrollToBot(focusedRef.value?.textareaEl),
  i: () => scrollToTop(focusedRef.value?.textareaEl),

  // right hand
  h: () => appState.upsertDBSync("focusedField", "text"),
  t: () => appState.upsertDBSync("focusedField", "memory"),
  n: () => appState.upsertDBSync("focusedField", null),
  f: () => toggleTopicFocus(topics[appState.focusedEntity].length - 1),

  m: () => onCopyContext("custom"),
  l: () => onCopyContext("full"),
  k: () => onCopyContext("mini"),

  // both hands
  "{": toggleDown,
  "}": toggleUp,
}

onMounted(async () => {
  events.loadFromDB()
  topics.loadFromDB()
  shapes.loadFromDB()
  await appState.loadFromDB()
  cleanupHotkeys = setupHotkeys(hotkeys)
  getFiles()
})
onUnmounted(cleanupHotkeys)

/////////////////////////////////// files //////////////////////////////////////
async function updateFilePath(path) {
  appState.upsertDBSync("filesPath", path)
  if (appState.focusedList === "files") {
    appState.upsertDBSync("focusedIndex", null)
  }
  await getFiles()
}
async function getFiles() {
  files.value = await apiGetFiles({
    path: appState.filesPath,
    ignore: [
      ".nuxt",
      ".output",
      ".vscode",
      "node_modules",
      "public",
      ".env",
      ".gitignore",
      "package-lock.json",
    ],
  })
  files.value = files.value.map((file) => {
    return { ...file, tokens: getTokens(file.content) }
  })
}
function toggleFileFocus(i) {
  const same = appState.focusedList === "files" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "files")
}
/////////////////////////////////// events /////////////////////////////////////
function newEvent() {
  events.upsertDBSync({
    id: newId(),
    date: new Date().toISOString(),
    name: "now",
    text: "",
    memory: {},
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
  topics[appState.focusedEntity].push("topic")
  topics.updateDBSync()
  toggleTopicFocus(topics[appState.focusedEntity].length - 1)
}
function toggleTopicFocus(i) {
  const same = appState.focusedList === "topics" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "topics")
}
function updateFocusedTopic(newTopicName) {
  const entity = appState.focusedEntity
  const i = appState.focusedIndex
  if (topics[entity] && topics[entity][i] !== undefined) {
    topics[entity][i] = newTopicName
    topics.updateDBSync()
  }
}
function removeFocusedTopic() {
  topics.removeDBSync(getFocusedTopic())
}
function sortTopic(direction) {
  const entityTopics = topics[appState.focusedEntity]
  const i = appState.focusedIndex
  if (!entityTopics || i === null) return
  if (
    (direction > 0 && i === entityTopics.length - 1) ||
    (direction < 0 && i === 0)
  ) {
    return
  }
  const newIndex = i + direction

  const topic = entityTopics[i]
  entityTopics.splice(i, 1)
  entityTopics.splice(newIndex, 0, topic)

  topics.updateDBSync()
  appState.upsertDBSync("focusedIndex", newIndex)
}
///////////////////////////////// context //////////////////////////////////////
// async function onGen(field) {
//   if (!getFocusedEvent()) return // hotkey case
//   const getContext = shapes[appState.focusedEntity]?.getContext
//   if (!getContext) return
//   const input = getContext(events, topics, shapes, files, appState, getTokens)
//   await getFiles()
// await apiGen({
//   model: "gemini-2.0-flash",
//   input,
//   event: getFocusedEvent(),
//   locked: isContextGenLocked,
//   field,
//   focusedEntity: appState.focusedEntity,
//   onNextChunk: events.tUpsertDBSync,
// })
// }
async function onContext(type) {
  if (!getFocusedEvent()) return // hotkey case
  await getFiles()
  let getContext
  const entityShapes = shapes[appState.focusedEntity]
  if (type === "full") getContext = entityShapes?.getContextFull
  else if (type === "mini") getContext = entityShapes?.getContextMini
  else if (type === "custom") getContext = entityShapes?.getContextCustom
  if (!getContext) return
  const input = getContext(events, topics, shapes, files.value, appState)
  await clipboard({ input, locked: isContextLocked[type] })
}
////////////////////////////////// entity //////////////////////////////////////
function onEntitySwitch(value) {
  appState.upsertDBSync("focusedEntity", value)
  if (appState.focusedList === "topics") {
    appState.upsertDBSync("focusedList", null)
    appState.upsertDBSync("focusedIndex", null)
  }
}
////////////////////////////////// shapes //////////////////////////////////////
function onCast(codeString) {
  eval(codeString)
  console.log("✅ spell casted successfully")
}
function toggleShapeFocus(i) {
  const same = appState.focusedList === "shapes" && appState.focusedIndex === i
  appState.upsertDBSync("focusedIndex", same ? null : i)
  appState.upsertDBSync("focusedList", same ? null : "shapes")
}
function getFocusedShape() {
  if (appState.focusedList !== "shapes" || appState.focusedIndex === null) {
    return null
  }
  const entity = appState.focusedEntity
  if (!shapes[entity]) return null // Ensure entity exists in shapes

  const shapeNames = Object.keys(shapes[entity])
  const name = shapeNames[appState.focusedIndex]
  const func = shapes[entity][name]

  if (!name || typeof func !== "function") return null // Ensure shape exists

  return { name, definition: func.toString() }
}
function handleUpdateShape(shapeName, newDefinition) {
  const entity = appState.focusedEntity
  const newFunc = new Function("return " + newDefinition)()
  shapes.upsertDBSync(entity, shapeName, newFunc)
  console.log(`🔄 Shape '${shapeName}' updated for entity '${entity}'.`)
}
////////////////////////////// file save load //////////////////////////////////
async function onFileSave() {
  const filename = `stone ${events[events.length - 1]?.name || ""}.json`
  const shapesRaw = {}
  for (const entity of entities) {
    shapesRaw[entity] = {}
    for (const [name, fn] of Object.entries(shapes[entity])) {
      shapesRaw[entity][name] = fn.toString()
    }
  }
  fileSave(filename, { events, topics, shapesRaw, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    appState.upsertDBSync("focusedIndex", null)

    events.clearDBSync()
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

    await topics.clearDBSync()
    entities.forEach((entity) => (topics[entity] = loadedData.topics[entity]))
    await topics.updateDBSync()

    await shapes.clearDBSync()
    for (const entity of entities) {
      const shapePromises = Object.entries(loadedData.shapesRaw[entity]).map(
        ([name, fn]) =>
          shapes.upsertDBSync(entity, name, new Function("return " + fn)())
      )
      await Promise.all(shapePromises)
    }

    const entries = Object.entries(loadedData.appState)
    await Promise.all(entries.map(([key, v]) => appState.upsertDBSync(key, v)))
    console.log(`⏬ data loaded from file [${timestamp()}]`)

    updateFocused.value++
  })
}
///////////////////////////////// helpers //////////////////////////////////////
function getFocusedEvent() {
  if (appState.focusedList !== "events") return null
  return events[appState.focusedIndex] || null
}
function getFocusedFile() {
  if (!files.value) return null
  if (appState.focusedList !== "files") return null
  return files.value[appState.focusedIndex] || null
}
function getFocusedTopic() {
  if (appState.focusedList !== "topics") return null
  const entity = appState.focusedEntity
  return topics[entity][appState.focusedIndex]
}
function toggleDown() {
  const list = appState.focusedList === "topics" ? topics : events
  let i =
    appState.focusedIndex === null ? list.length - 1 : appState.focusedIndex - 1
  if (i < 0) return
  appState.focusedList === "topics" ? toggleTopicFocus(i) : toggleEventFocus(i)
}
function toggleUp() {
  const list = appState.focusedList === "topics" ? topics : events
  let i = appState.focusedIndex === null ? 0 : appState.focusedIndex + 1
  if (i > list.length - 1) return
  appState.focusedList === "topics" ? toggleTopicFocus(i) : toggleEventFocus(i)
}
/////////////////////////////////// new shit ///////////////////////////////////
function appendDraftToEvent() {
  const currentEvent = getFocusedEvent()
  if (!currentEvent || !appState.draft) return
  currentEvent.text = [
    currentEvent.text,
    `${capitalize(useRuntimeConfig().public.human)}\n${appState.draft}`,
    `${capitalize(appState.focusedEntity)}\n`,
  ].join("\n\n")
  updateFocusedEvent(["text", currentEvent.text])
  clipboard({ input: appState.draft })
  appState.upsertDBSync("draft", "")
  nextTick(() => scrollToBot(focusedRef.value?.textareaEl))
}
function switchToNextEntity() {
  let index = entities.findIndex((e) => e === appState.focusedEntity)
  index += 1
  if (index === entities.length) index = 0
  onEntitySwitch(entities[index])
}
</script>
