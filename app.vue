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
            (getFocusedEvent() && appState.focusedList === 'events') ||
            (focusedTagString && appState.focusedList === 'tags') || // Condition for FocusedTag
            (getFocusedFile() && appState.focusedList === 'files') ||
            (getFocusedShape() && appState.focusedList === 'shapes')
          "
        >
          <FocusedEvent
            v-if="getFocusedEvent() && appState.focusedList === 'events'"
            :key="`event-${appState.focusedIndex}-${appState.focusedField}-${appState.focusedEntity}-${updateFocused}`"
            ref="focusedRef"
            :event="getFocusedEvent()"
            :field="appState.focusedField"
            :fields="['text', 'memory']"
            :focused-entity="appState.focusedEntity"
            @update-event="updateFocusedEvent"
            @remove-event="removeFocusedEvent"
            @update-app-state="
              (key, value) => appState.upsertDBSync(key, value)
            "
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <FocusedTag
            v-else-if="focusedTagString && appState.focusedList === 'tags'"
            :key="`tag-${appState.focusedIndex}-${appState.focusedEntity}`"
            :focusedTag="focusedTagString"
            :events="events"
            :focusedEntity="appState.focusedEntity"
          />
          <FocusedFile
            ref="focusedRef"
            v-else-if="getFocusedFile() && appState.focusedList === 'files'"
            :key="`file-${appState.focusedIndex}`"
            :file="getFocusedFile()"
          />
          <FocusedShape
            ref="focusedRef"
            v-else-if="getFocusedShape() && appState.focusedList === 'shapes'"
            :key="`focused-shape-${appState.focusedIndex}-${appState.focusedEntity}`"
            :shapeName="getFocusedShape().name"
            :shapeDefinition="getFocusedShape().definition"
            @update-shape="onUpdateShape"
            @lock-hotkeys="() => (hotkeysLockedByInput = true)"
            @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
          />
          <!-- Draft and Spell components remain below -->
          <Draft
            ref="focusedDraftRef"
            v-if="
              appState.draft !== undefined &&
              appState.focusedField === 'text' &&
              appState.focusedList === 'events' // Only show for events
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
              appState.focusedList === 'events' // Only show for events
            "
            ref="focusedSpellRef"
            :events="events"
            :shapes="shapes"
            :files="files"
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
        <Tags
          :uniqueTags="uniqueTagsForEntity"
          :events="events"
          :focusedEntity="appState.focusedEntity"
          :focusedIndex="appState.focusedIndex"
          :focusedList="appState.focusedList"
          @toggle-focus="toggleTagFocus"
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
import remember from "/utils/remember"
import newId from "/utils/newId"

const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()
const { entities, events, shapes, appState } = useDatabase()

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
  entity: ref(false),
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

  m: () => onContext("entity"),
  l: () => onContext("full"),
  k: () => onContext("mini"),
}

const uniqueTagsForEntity = computed(() => {
  const tagSet = new Set()
  events.forEach((event) => {
    const memories = event.memory[appState.focusedEntity]
    if (Array.isArray(memories)) {
      memories.forEach((memoryObj) => {
        if (Array.isArray(memoryObj.tags)) {
          memoryObj.tags.forEach((tag) => tagSet.add(tag))
        }
      })
    }
  })
  return Array.from(tagSet).sort()
})

const focusedTagString = computed(() => {
  // This MUST return the actual tag string when a tag is focused
  if (appState.focusedList !== "tags" || appState.focusedIndex === null) {
    return null
  }
  const tags = uniqueTagsForEntity.value
  // Check if the index is valid for the current tags array
  if (appState.focusedIndex >= 0 && appState.focusedIndex < tags.length) {
    return tags[appState.focusedIndex]
  }
  return null // Return null if index is out of bounds
})

onMounted(async () => {
  events.loadFromDB()
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
////////////////////////////////// tags //////////////////////////////////////
function toggleTagFocus(i) {
  const same = appState.focusedList === "tags" && appState.focusedIndex === i
  const newIndex = same ? null : i
  const newList = same ? null : "tags"

  appState.upsertDBSync("focusedIndex", newIndex)
  appState.upsertDBSync("focusedList", newList)

  // IMPORTANT: When focusing a tag, set field to null to show the pretty view (FocusedTag)
  // if (newList === "tags") {
  //   appState.upsertDBSync("focusedField", null)
  // }
  // Optional: Log state changes for debugging
  // console.log(`toggleTagFocus: index=${newIndex}, list=${newList}`)
}
///////////////////////////////// context //////////////////////////////////////
// async function onGen(field) {
//   if (!getFocusedEvent()) return // hotkey case
//   const getContext = shapes[appState.focusedEntity]?.getContext
//   if (!getContext) return
//   const input = getContext(events, shapes, files, appState, getTokens)
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
  const event = getFocusedEvent()
  if (!event) return // hotkey case
  await getFiles()

  const entity = appState.focusedEntity
  const helpers = { getAllFilePaths, getAllEntityTags, getAllEntityEventNames }
  let config
  if (type === "full") {
    config = getContextConfig(events, files.value, entity, "full")
  } else if (type === "mini") {
    config = getContextConfig(events, files.value, entity, "mini")
  } else if (type === "entity") {
    config = shapes[entity]?.getContextConfig(events, files.value, helpers)
  }
  if (!config) return
  const input = getContext(
    events,
    event,
    shapes,
    files.value,
    appState.focusedEntity,
    config
  )
  await clipboard({ input, locked: isContextLocked[type] })
}
////////////////////////////////// entity //////////////////////////////////////
function onEntitySwitch(value) {
  appState.upsertDBSync("focusedEntity", value)
  if (appState.focusedList === "tags") {
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
  if (
    appState.focusedList !== "shapes" ||
    appState.focusedIndex === null ||
    !shapes[appState.focusedEntity]
  ) {
    return null
  }
  const shapeNames = Object.keys(shapes[appState.focusedEntity])
  const name = shapeNames[appState.focusedIndex]
  const func = shapes[appState.focusedEntity][name]
  if (!name) return null
  return { name, definition: func.toString() }
}
function onUpdateShape(shapeName, newDefinition) {
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
  fileSave(filename, { events, shapesRaw, appState })
}
async function onFileLoad() {
  fileLoad(async (loadedData) => {
    appState.upsertDBSync("focusedIndex", null)

    events.clearDBSync()
    await Promise.all(loadedData.events.map((e) => events.upsertDBSync(e)))

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
function getFocusedTag() {
  return
  // if (appState.focusedList !== "tags") return null
  // const entity = appState.focusedEntity
  // return tags[entity][appState.focusedIndex]
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
