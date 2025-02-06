<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <div class="flex">
        <button
          @click="createFreeText()"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
        <button
          @click="moveFreeTextDown"
          class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
          :class="
            freeTextId === null || freeText.sort === 0
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <Arrow class="w-3 rotate-90" />
        </button>
        <button
          @click="moveFreeTextUp"
          class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
          :class="
            freeTextId === null || freeText.sort === freeTextsSorted.length - 1
              ? 'cursor-default bg-slate-50 text-stone-500/60'
              : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
          "
        >
          <Arrow class="w-3 -rotate-90" />
        </button>
      </div>
      <div ref="freeTextsRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="[id, { name }] in freeTextsSorted"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              freeTextId === id
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
            "
            @click="toggleFreeText(id)"
          >
            {{ name }}
          </button>
        </div>
      </div>
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
    <div class="flex flex-col flex-grow">
      <div
        class="flex flex-col flex-grow overflow-hidden rounded-lg"
        v-if="freeTextId || textId"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <button
            @click="pullFromCollection"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              freeTextId
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 rotate-180" />
          </button>
          <input
            type="text"
            v-model="textName"
            @input="onInput"
            class="z-10 rounded-b-2xl hover:bg-stone-800 focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <button
            @click="pushIntoCollection"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              !collectionId || textId
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3" />
          </button>
        </div>
        <textarea
          ref="textContentRef"
          v-model="textContent"
          @input="onInput"
          @scroll="onTextScroll"
          class="-mt-4 -mb-7 h-full bg-lines scroll-light bg-stone-400 pt-7 p-8 resize-none focus:outline-none text-stone-800 text-xl rounded-b-lg"
          :style="{ bgTextPositionY }"
        ></textarea>
        <button
          @click="removeText"
          class="max-h-7 w-full bg-stone-700 justify-self-end text-stone-400 pb-1 hover:bg-stone-800 self-end hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <div class="w-[180px] h-full">
      <div
        class="bg-stone-500 bg-circles w-full h-full flex flex-col justify-between rounded-lg overflow-hidden"
        v-if="collectionId"
      >
        <input
          type="text"
          v-model="collectionName"
          @input="onInput"
          class="z-10 px-4 h-11 pb-1 hover:bg-stone-800 focus:bg-stone-800 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
        />
        <div class="h-7 flex justify-end bg-stone-700">
          <button
            @click="createText"
            class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
          >
            new
          </button>
          <button
            @click="moveTextDown"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              textId === null || text.sort === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 rotate-90" />
          </button>
          <button
            @click="moveTextUp"
            class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              textId === null || text.sort === textsSorted.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 -rotate-90" />
          </button>
        </div>
        <div ref="textsRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="[id, { name }] in textsSorted"
              class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
              :class="
                textId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
              "
              @click="toggleText(id)"
            >
              {{ name }}
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
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
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
          <Arrow class="w-3 rotate-90" />
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
          <Arrow class="w-3 -rotate-90" />
        </button>
      </div>
      <div ref="collectionsRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="[id, { name }] in collectionsSorted"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              collectionId === id
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
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

// handle v-model fields to edit
const textName = ref("")
const textContent = ref("")
const collectionName = ref("")

let removed = null

const bgTextPositionY = ref("0px")
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 300)

const freeText = computed(() => freeTexts.value[freeTextId.value])
const collection = computed(() => collections.value[collectionId.value])
const text = computed(() => collection.value?.texts[textId.value])

const freeTextsSorted = computed(() => {
  return Object.entries(freeTexts.value).sort(([, a], [, b]) => a.sort - b.sort)
})
const collectionsSorted = computed(() => {
  return Object.entries(collections.value).sort(
    ([, a], [, b]) => a.sort - b.sort
  )
})
const textsSorted = computed(() => {
  return Object.entries(collection.value.texts).sort(
    ([, a], [, b]) => a.sort - b.sort
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
    sort: Object.keys(collection.value.texts).length,
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
    sort: Object.keys(collections.value).length,
  }
  toggleCollection(id)
  nextTick(() => {
    collectionsRef.value.scrollTop =
      collectionsRef.value.clientHeight - collectionsRef.value.scrollHeight
  })
}
function toggleFreeText(id) {
  if (freeTextId.value === id) freeTextId.value = null
  else freeTextId.value = id
  textId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleText(id) {
  if (textId.value === id) textId.value = null
  else textId.value = id
  freeTextId.value = null
  updateInputFields()
  debouncedSaveLocalStorageItem()
}
function toggleCollection(id) {
  if (collectionId.value === id) collectionId.value = null
  else collectionId.value = id
  textId.value = null
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
}
function onInput() {
  if (collectionId.value) collection.value.name = collectionName.value
  const currentText = freeText.value || text.value
  if (currentText) {
    currentText.name = textName.value
    currentText.content = textContent.value
  }
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
  move(collection.value.texts, textId.value, text.value, 1)
}
function moveTextDown() {
  move(collection.value.texts, textId.value, text.value, -1)
}
function moveCollectionUp() {
  move(collections.value, collectionId.value, collection.value, 1)
}
function moveCollectionDown() {
  move(collections.value, collectionId.value, collection.value, -1)
}
function pushIntoCollection() {
  if (!collectionId.value || textId.value) return
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
    sort: Object.keys(collection.value.texts).length,
  }
  freeTextId.value = null
  textId.value = cache.freeTextId
  updateInputFields()
  debouncedSaveLocalStorageItem()
}

function pullFromCollection() {
  if (freeTextId.value) return
  const cache = {
    textId: textId.value,
    text: text.value,
  }
  delete collection.value.texts[cache.textId]
  Object.values(collection.value.texts).forEach((text) => {
    if (text.sort > cache.text.sort) text.sort--
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
  if (freeTextId.value || textId.value) {
    nextTick(() => textContentRef.value.focus())
  }
  updateInputFields()
}
function onTextScroll(event) {
  bgTextPositionY.value = `-${event.target.scrollTop}px`
}
function onFileLoad() {
  fileLoad(injectStorage)
  debouncedSaveLocalStorageItem()
}
</script>
