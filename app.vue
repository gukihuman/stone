<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div class="w-[205px] flex flex-col gap-1">
      <div
        class="flex flex-col flex-grow bg-circles bg-stone-500 rounded-lg overflow-hidden"
      >
        <div class="flex">
          <button
            @click="moveFreeTextDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              freeTextId === null || freeText.sort === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 rotate-90" />
          </button>
          <button
            @click="moveFreeTextUp"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              freeTextId === null ||
              freeText.sort === freeTextsSorted.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 -rotate-90" />
          </button>
          <button
            @click="createFreeText()"
            class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
          >
            new
          </button>
        </div>
        <div ref="freeTextsRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="[id, { name }] in freeTextsSorted"
              class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none text-stone-200"
              :class="
                freeTextId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
              "
              @click="toggleFreeText(id)"
            >
              {{ name }}
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
        v-if="freeTextId || textId || linkId || resultId"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <button
            @click="pullFromCollection"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              !textId
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3 rotate-180" />
          </button>
          <input
            v-if="linkId || resultId"
            :placeholder="linkId ? collections[linkId].name : 'result'"
            disabled
            class="flex z-10 rounded-b-2xl flex-grow px-7 pb-1 bg-stone-700 text-xl text-center cursor-default truncate placeholder:text-stone-300"
          />
          <input
            v-else
            type="text"
            v-model="textName"
            @input="onInput"
            @focus="linkState = false"
            class="z-10 rounded-b-2xl focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
          />
          <button
            @click="pushIntoCollection"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              !collectionId || !freeTextId
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <IconArrow class="w-3" />
          </button>
        </div>
        <textarea
          v-if="linkId"
          @scroll="onTextScroll"
          disabled
          class="-mt-4 h-full bg-lines scroll-light bg-stone-400 pt-7 pb-7 p-8 resize-none text-stone-800 text-xl cursor-default"
          :style="{ backgroundPositionY }"
          >{{ collections[linkId].result }}</textarea
        >
        <textarea
          v-else
          ref="textContentRef"
          v-model="textContent"
          @input="onInput"
          @focus="linkState = false"
          @scroll="onTextScroll"
          class="-mt-4 h-full bg-lines scroll-light bg-stone-400 pt-7 pb-7 p-8 resize-none text-stone-800 text-xl"
          :style="{ backgroundPositionY }"
        ></textarea>
        <button
          v-if="linkId"
          @click="unlink"
          class="max-h-7 w-full bg-stone-700 justify-self-end text-stone-400 pb-1 hover:bg-stone-800 self-end hover:text-stone-300"
        >
          unlink
        </button>
        <button
          v-else-if="freeTextId || textId"
          @click="removeText"
          class="max-h-7 w-full bg-stone-700 justify-self-end text-stone-400 pb-1 hover:bg-stone-800 self-end hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <div class="w-[205px] h-full">
      <div
        class="bg-stone-500 bg-circles w-full h-full flex flex-col justify-between rounded-lg overflow-hidden"
        v-if="collectionId"
      >
        <div class="flex flex-col flex-shrink-0">
          <input
            type="text"
            v-model="collectionName"
            @input="onInput"
            @focus="linkState = false"
            class="z-10 px-4 h-11 pb-1 hover:bg-stone-800 focus:bg-stone-800 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <div class="h-7 flex justify-end bg-stone-700">
            <button
              @click="moveTextDown"
              class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
              :class="
                (textId === null && linkId === null) ||
                (linkId === null && text.sort === 0) ||
                (textId === null && link.sort === 0)
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <IconArrow class="w-3 rotate-90" />
            </button>
            <button
              @click="moveTextUp"
              class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
              :class="
                (textId === null && linkId === null) ||
                (linkId === null &&
                  text.sort === textsLinksSorted.length - 1) ||
                (textId === null && link.sort === textsLinksSorted.length - 1)
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <IconArrow class="w-3 -rotate-90" />
            </button>
            <button
              @click="copyToClipboard"
              class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
            >
              copy
            </button>
            <button
              @click="createText"
              class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
            >
              new
            </button>
            <button
              @click="linkState ? (linkState = false) : (linkState = true)"
              class="w-full pb-1"
              :class="
                linkState
                  ? 'bg-stone-400 text-stone-800'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              link
            </button>
          </div>
        </div>
        <div ref="textsRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              class="border-t-4 border-dotted border-stone-400/50 py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none text-stone-200 bg-gradient-to-r to-transparent"
              :class="
                resultId
                  ? 'pl-5 from-stone-600'
                  : 'pl-3 hover:from-stone-600/50'
              "
              @click="toggleResult"
            >
              result
            </button>
            <button
              v-for="[id, { name }] in textsLinksSorted"
              class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none text-stone-200 bg-gradient-to-r to-transparent"
              :class="
                collection.texts[id]
                  ? textId === id
                    ? 'pl-5 from-stone-600'
                    : 'pl-3 hover:from-stone-600/50'
                  : linkId === id
                  ? 'pl-5 from-stone-200/50 text-stone-200'
                  : 'pl-3 from-stone-400/50 hover:from-stone-400/50 text-stone-200'
              "
              @click="collection.texts[id] ? toggleText(id) : toggleLink(id)"
            >
              <IconCloud v-if="collection.links[id]" class="inline-block w-3" />
              <span :class="{ 'pl-2': collection.links[id] }">
                {{ name }}
              </span>
            </button>
          </div>
        </div>
        <button
          @click="removeCollection"
          class="max-h-7 w-full bg-stone-700 self-end text-stone-400 pb-1 hover:bg-stone-800 hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <div
      class="bg-stone-500 bg-circles w-[170px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <div class="h-7 flex justify-end bg-stone-700">
        <button
          @click="createCollection"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
        <button
          @click="moveCollectionDown"
          class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
          :class="
            collectionId === null || collection.sort === 0
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <IconArrow class="w-3 rotate-90" />
        </button>
        <button
          @click="moveCollectionUp"
          class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
          :class="
            collectionId === null ||
            collection.sort === collectionsSorted.length - 1
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <IconArrow class="w-3 -rotate-90" />
        </button>
      </div>
      <div ref="collectionsRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-if="linkState"
            v-for="[id, { name }] in collectionsSorted"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="{
              'pl-5 bg-gradient-to-r from-stone-600 to-transparent text-stone-200':
                collectionId === id,
              'pl-3 bg-gradient-to-r from-stone-400/50 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent text-stone-200':
                collectionId !== id && !alreadyLinked(id),
              'pl-3 cursor-default text-stone-400': alreadyLinked(id),
            }"
            @click="createLink(id)"
          >
            <IconCloud v-if="collectionId !== id" class="inline-block w-3" />
            <span :class="{ 'pl-2': collectionId !== id }">
              {{ name }}
            </span>
          </button>
          <button
            v-else
            v-for="[id, { name }] in collectionsSorted"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none text-stone-200"
            :class="
              collectionId === id
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent'
            "
            @click="toggleCollection(id)"
          >
            {{ name }}
          </button>
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
import newName from "./utils/newName"
import timestamp from "./utils/timestamp"
const LOCAL_STORAGE_KEY = "stone"
const freeTextsRef = ref(null)
const textContentRef = ref(null)
const textsRef = ref(null)
const collectionsRef = ref(null)

const freeTexts = ref({})
const freeTextId = ref(null)
const collections = ref({})
const collectionId = ref(null)
const textId = ref(null)
const linkId = ref(null)
const resultId = ref(null)

// handle v-model fields to edit
const textName = ref("")
const textContent = ref("")
const collectionName = ref("")

const linkState = ref(false)

let removed = null

const backgroundPositionY = ref("0px")
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 300)

const freeText = computed(() => freeTexts.value[freeTextId.value])
const collection = computed(() => collections.value[collectionId.value])
const text = computed(() => collection.value?.texts[textId.value])
const link = computed(() => collection.value?.links[linkId.value])
const result = computed(() => collection.value?.result)

const freeTextsSorted = computed(() => {
  return Object.entries(freeTexts.value).sort(([, a], [, b]) => a.sort - b.sort)
})
const collectionsSorted = computed(() => {
  return Object.entries(collections.value).sort(
    ([, a], [, b]) => a.sort - b.sort
  )
})
const textsLinksSorted = computed(() => {
  const textEntries = Object.entries(collection.value.texts)
  const linkEntries = Object.entries(collection.value.links)
  return [...textEntries, ...linkEntries].sort(
    ([, a], [, b]) => a.sort - b.sort
  )
})
const textsLinksLength = computed(() => {
  return (
    Object.keys(collection.value.texts).length +
    Object.keys(collection.value.links).length
  )
})

onMounted(loadLocalStorageItem)

function createFreeText() {
  const id = newId()
  freeTexts.value[id] = {
    name: newName(),
    content: "",
    sort: Object.keys(freeTexts.value).length,
  }
  toggleFreeText(id)
  nextTick(() => {
    textContentRef.value.focus()
    freeTextsRef.value.scrollTop =
      freeTextsRef.value.clientHeight - freeTextsRef.value.scrollHeight
  })
}
function createText() {
  const id = newId()
  collection.value.texts[id] = {
    name: newName(),
    content: "",
    sort: textsLinksLength.value,
  }
  toggleText(id)
  nextTick(() => {
    textContentRef.value.focus()
    freeTextsRef.value.scrollTop =
      freeTextsRef.value.clientHeight - freeTextsRef.value.scrollHeight
  })
}
function createCollection() {
  const id = newId()
  collections.value[id] = {
    name: newName(),
    texts: {},
    links: {},
    result: "",
    sort: Object.keys(collections.value).length,
  }
  toggleCollection(id)
  nextTick(() => {
    collectionsRef.value.scrollTop =
      collectionsRef.value.clientHeight - collectionsRef.value.scrollHeight
  })
}
function createLink(id) {
  if (alreadyLinked(id)) return
  if (collectionId.value === id) {
    toggleCollection(id)
    linkState.value = false
    return
  }
  collection.value.links[id] = {
    name: collections.value[id].name,
    sort: textsLinksLength.value,
  }
  debouncedSaveLocalStorageItem()
}
function alreadyLinked(id) {
  return collection.value.links[id]
}
function toggleFreeText(id) {
  linkState.value = false
  if (freeTextId.value === id) freeTextId.value = null
  else freeTextId.value = id
  textId.value = null
  linkId.value = null
  resultId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleText(id) {
  linkState.value = false
  if (textId.value === id) textId.value = null
  else textId.value = id
  freeTextId.value = null
  linkId.value = null
  resultId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleCollection(id) {
  linkState.value = false
  if (collectionId.value === id) collectionId.value = null
  else collectionId.value = id
  textId.value = null
  linkId.value = null
  resultId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleLink(id) {
  linkState.value = false
  if (linkId.value === id) linkId.value = null
  else linkId.value = id
  freeTextId.value = null
  textId.value = null
  resultId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleResult() {
  linkState.value = false
  if (resultId.value) resultId.value = null
  else resultId.value = 1
  freeTextId.value = null
  textId.value = null
  linkId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function updateInputFields() {
  if (collectionId.value) collectionName.value = collection.value.name
  const currentText = freeText.value || text.value
  if (currentText) {
    textName.value = currentText.name
    textContent.value = currentText.content
  }
  if (linkId.value) textContent.value = result.value
  if (resultId.value) textContent.value = result.value
}
function onInput() {
  if (collectionId.value) {
    collection.value.name = collectionName.value
    Object.values(collections.value).forEach((collection) => {
      if (collection.links[collectionId.value]) {
        collection.links[collectionId.value].name = collectionName.value
      }
    })
  }
  const currentText = freeText.value || text.value
  if (currentText) {
    currentText.name = textName.value
    currentText.content = textContent.value
  }
  if (resultId.value) collection.value.result = textContent.value
  debouncedSaveLocalStorageItem()
}
function unlink() {
  Object.values(collection.value.links).forEach((link) => {
    if (link.sort > collection.value.links[linkId.value].sort) link.sort--
  })
  Object.values(collection.value.texts).forEach((text) => {
    if (text.sort > collection.value.links[linkId.value].sort) text.sort--
  })
  delete collection.value.links[linkId.value]
  linkId.value = null
  debouncedSaveLocalStorageItem()
}
function removeText() {
  removed = {}
  if (freeTextId.value) {
    const id = freeTextId.value
    removed.freeText = freeText.value
    removed.freeTextId = id
    toggleFreeText(id)
    delete freeTexts.value[id]
    Object.values(freeTexts.value).forEach((freeText) => {
      if (freeText.sort > removed.freeText.sort) freeText.sort--
    })
  }
  if (textId.value) {
    const id = textId.value
    removed.collectionId = collectionId.value
    removed.text = text.value
    removed.textId = id
    toggleText(id)
    delete collections.value[removed.collectionId].texts[id]
    Object.values(collection.value.texts).forEach((text) => {
      if (text.sort > removed.text.sort) text.sort--
    })
    Object.values(collection.value.links).forEach((link) => {
      if (link.sort > removed.text.sort) link.sort--
    })
  }
}
function removeCollection() {
  removed = {}
  const id = collectionId.value
  removed.collection = collections.value[id]
  removed.collectionId = id
  toggleCollection(id)
  delete collections.value[id]
  Object.values(collections.value).forEach((collection) => {
    if (collection.sort > removed.collection.sort) collection.sort--
  })
}
function restore() {
  if (!removed) return
  if (removed.freeText) {
    freeTexts.value[removed.freeTextId] = {
      ...removed.freeText,
      sort: Object.keys(freeTexts.value).length,
    }
    toggleFreeText(removed.freeTextId)
  } else if (removed.text) {
    collections.value[removed.collectionId].texts[removed.textId] = {
      ...removed.text,
      sort: Object.keys(collection.value.texts).length,
    }
    toggleText(removed.textId)
  } else if (removed.collection) {
    collections.value[removed.collectionId] = {
      ...removed.collection,
      sort: Object.keys(collections.value).length,
    }
    toggleCollection(removed.collectionId)
  }
  removed = null
  debouncedSaveLocalStorageItem()
}
function move(obj, id, item, step) {
  if (!id) return
  linkState.value = false
  const target = Object.entries(obj).find(
    ([, target]) => target.sort === item.sort + step
  )?.[1]
  if (!target) return
  target.sort = target.sort - step
  item.sort = item.sort + step
  debouncedSaveLocalStorageItem()
}
function moveFreeTextUp() {
  move(freeTexts.value, freeTextId.value, freeText.value, 1)
}
function moveFreeTextDown() {
  move(freeTexts.value, freeTextId.value, freeText.value, -1)
}
function moveTextUp() {
  move(
    { ...collection.value.texts, ...collection.value.links },
    textId.value || linkId.value,
    textId.value ? text.value : collection.value.links[linkId.value],
    1
  )
}

function moveTextDown() {
  move(
    { ...collection.value.texts, ...collection.value.links },
    textId.value || linkId.value,
    textId.value ? text.value : collection.value.links[linkId.value],
    -1
  )
}
function moveCollectionUp() {
  move(collections.value, collectionId.value, collection.value, 1)
}
function moveCollectionDown() {
  move(collections.value, collectionId.value, collection.value, -1)
}
function pushIntoCollection() {
  if (!collectionId.value || !freeTextId.value) return
  linkState.value = false
  const cache = {
    freeTextId: freeTextId.value,
    freeText: freeText.value,
  }
  delete freeTexts.value[cache.freeTextId]
  Object.values(freeTexts.value).forEach((freeText) => {
    if (freeText.sort > cache.freeText.sort) freeText.sort--
  })
  collection.value.texts[cache.freeTextId] = {
    ...cache.freeText,
    sort: textsLinksLength.value,
  }
  freeTextId.value = null
  textId.value = cache.freeTextId
  updateInputFields()
  debouncedSaveLocalStorageItem()
}

function pullFromCollection() {
  if (!textId.value) return
  linkState.value = false
  const cache = {
    textId: textId.value,
    text: text.value,
  }
  delete collection.value.texts[cache.textId]
  Object.values(collection.value.texts).forEach((text) => {
    if (text.sort > cache.text.sort) text.sort--
  })
  Object.values(collection.value.links).forEach((links) => {
    if (links.sort > cache.text.sort) links.sort--
  })
  freeTexts.value[cache.textId] = {
    ...cache.text,
    sort: Object.keys(freeTexts.value).length,
  }
  freeTextId.value = cache.textId
  textId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function getStorage() {
  return {
    freeTexts: freeTexts.value,
    freeTextId: freeTextId.value,
    collections: collections.value,
    collectionId: collectionId.value,
    textId: textId.value,
    linkId: linkId.value,
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
  freeTexts.value = storage.freeTexts
  freeTextId.value = storage.freeTextId
  collections.value = storage.collections
  collectionId.value = storage.collectionId
  textId.value = storage.textId
  linkId.value = storage.linkId
  updateInputFields()
}
function onTextScroll(event) {
  backgroundPositionY.value = `-${event.target.scrollTop}px`
}
async function copyToClipboard() {
  let output = ""
  _.forEachRight(textsLinksSorted.value, ([id, { name, content }]) => {
    output += name + "\n"
    if (content || content === "") output += content + "\n---\n"
    else output += collections.value[id].result + "\n---\n"
  })
  try {
    await navigator.clipboard.writeText(output)
    console.log(`⏬ ${collection.value.name} copied! [${timestamp()}]`)
  } catch (err) {
    console.error("Failed to copy:", err)
  }
}
async function onFileLoad() {
  await fileLoad(injectStorage)
  debouncedSaveLocalStorageItem()
}
</script>
