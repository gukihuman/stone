<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <button
        @click="createFreeText()"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div ref="freeTextsRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="({ name }, id) in freeTexts"
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
        @click="saveFile"
        class="bg-stone-700 w-full justify-self-end text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        save
      </button>
      <button
        @click="loadFile"
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
            @click="moveTextDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              collections === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 rotate-90" />
          </button>
          <button
            @click="moveTextUp"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              collections === 0
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 -rotate-90" />
          </button>
          <input
            type="text"
            v-model="textName"
            @input="onInput"
            class="z-10 rounded-b-2xl flex-grow px-7 pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <button
            @click="pullFromCollection"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              collectionId
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 rotate-180" />
          </button>
          <button
            @click="pushIntoCollection"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end pb-1"
            :class="
              collectionId
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
        <div class="flex">
          <input
            type="text"
            v-model="collectionName"
            @input="onInput"
            class="z-10 rounded-br-xl px-4 h-11 w-[108px] pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <div class="h-7 flex justify-end bg-stone-700">
            <button
              @click="moveCollectionDown"
              class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
              :class="
                collections === 0
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
                collections === 0
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <Arrow class="w-3 -rotate-90" />
            </button>
          </div>
        </div>
        <div ref="textsRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="({ name }, id) in collection.texts"
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
      <button
        @click="createCollection"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div ref="collectionsRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="({ name }, id) in collections"
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
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 200)

const freeText = computed(() => freeTexts.value[freeTextId.value])
const collection = computed(() => collections.value[collectionId.value])
const text = computed(() => collection.value?.texts[textId.value])

onMounted(loadLocalStorageItem)

function createFreeText() {
  const id = generateRandomId()
  freeTexts.value[id] = {
    name: id,
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
function createText(collectionId) {
  const id = generateRandomId()
  collection.value.texts[id] = {
    name: id,
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
  const id = generateRandomId()
  collections.value[id] = {
    name: id,
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
  saveLocalStorageItem()
}
function toggleText(id) {
  if (textId.value === id) textId.value = null
  else textId.value = id
  freeTextId.value = null
  updateInputFields()
  saveLocalStorageItem()
}
function toggleCollection(id) {
  if (collectionId.value === id) collectionId.value = null
  else collectionId.value = id
  textId.value = null
  updateInputFields()
  saveLocalStorageItem()
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
  }
  if (textId.value) {
    const id = textId.value
    removed.collectionId = collectionId.value
    removed.text = text.value
    removed.textId = id
    toggleText(id)
    delete collections.value[removed.collectionId].texts[id]
  }
}
function removeCollection() {
  removed = {}
  const id = collectionId.value
  removed.collection = collections.value[id]
  removed.collectionId = id
  toggleCollection(id)
  delete collections.value[id]
}
function restore() {
  if (!removed) return
  if (removed.freeText) {
    freeTexts.value[removed.freeTextId] = removed.freeText
    toggleFreeText(removed.freeTextId)
  } else if (removed.text) {
    collections.value[removed.collectionId].texts[removed.textId] = removed.text
    toggleText(removed.textId)
  } else if (removed.collection) {
    collections.value[removed.collectionId] = removed.collection
    toggleCollection(removed.collectionId)
  }
  removed = null
  saveLocalStorageItem()
}
function moveTextUp() {
  const indexCache = textId.value
  if (indexCache === collections.value.length - 1) return
  const movedText = collections.value.splice(indexCache, 1)[0]
  collections.value.splice(indexCache + 1, 0, movedText)
  saveLocalStorageItem()
}
function moveTextDown() {
  const indexCache = textId.value
  if (indexCache === 0) return
  const movedText = collections.value.splice(indexCache, 1)[0]
  collections.value.splice(indexCache - 1, 0, movedText)
  saveLocalStorageItem()
}
function moveUp() {
  const indexCache = collectionId.value
  if (indexCache === collectionArray.value.length - 1) return
  const movedCollection = collectionArray.value.splice(indexCache, 1)[0]
  collectionArray.value.splice(indexCache + 1, 0, movedCollection)
  saveLocalStorageItem()
}
function moveDown() {
  const indexCache = collectionId.value
  if (indexCache === 0) return
  const movedCollection = collectionArray.value.splice(indexCache, 1)[0]
  collectionArray.value.splice(indexCache - 1, 0, movedCollection)
  saveLocalStorageItem()
}
function pushIntoCollection() {
  if (collecte === -1) return
  collectionArray.value[collectionId.value].textIds.add(textId.value)
  saveLocalStorageItem()
}
function pullFromCollection() {
  if (collecte === -1) return
  collectionArray.value[collectionId.value].textIds.delete(textId.value)
  saveLocalStorageItem()
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
function saveFile() {
  const storage = JSON.stringify(getStorage())
  const blob = new Blob([storage], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  document.body.appendChild(a)
  a.style = "display: none"
  a.href = url
  a.download = "stone.json"
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
function loadFile() {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.style.display = "none"
  fileInput.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          injectStorage(JSON.parse(e.target.result))
        } catch (error) {
          console.error("Error parsing JSON:", error)
        }
      }
      reader.readAsText(file)
    }
  }
  document.body.appendChild(fileInput)
  fileInput.click()
  fileInput.remove()
  saveLocalStorageItem()
}
function generateRandomId() {
  return Math.random().toString().slice(2, 18)
}
function onTextScroll(event) {
  bgTextPositionY.value = `-${event.target.scrollTop}px`
}
</script>
