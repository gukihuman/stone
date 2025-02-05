<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <button
        @click="createText"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div ref="textArrayRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="{ id, name } in textArray"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              selectedTextId === id
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
            "
            @click="selectText(id)"
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
          lastRemovedText || lastRemovedCollection
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
        v-show="selectedTextIndex !== -1"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <button
            @click="moveTextDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              textArray.findIndex(({ id }) => id === selectedTextId) === 0
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
              textArray.findIndex(({ id }) => id === selectedTextId) ===
              textArray.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 -rotate-90" />
          </button>
          <input
            type="text"
            v-model="selectedTextName"
            @input="onInput"
            class="z-10 rounded-b-2xl flex-grow px-7 pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <button
            @click="pullFromCollection"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              selectedCollectionId === -1
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
              selectedCollectionId === -1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3" />
          </button>
        </div>
        <textarea
          ref="textRef"
          v-model="selectedTextContent"
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
        v-show="selectedCollectionId !== -1"
      >
        <div class="flex">
          <input
            type="text"
            v-model="selectedCollectionName"
            @input="onInput"
            class="z-10 rounded-br-xl px-4 h-11 w-[108px] pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <div class="h-7 flex justify-end bg-stone-700">
            <button
              @click="moveCollectionDown"
              class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
              :class="
                collectionArray.findIndex(
                  ({ id }) => id === selectedCollectionId
                ) === 0
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
                collectionArray.findIndex(
                  ({ id }) => id === selectedCollectionId
                ) ===
                collectionArray.length - 1
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <Arrow class="w-3 -rotate-90" />
            </button>
          </div>
        </div>
        <div ref="collectionTextArrayRef" class="flex-grow overflow-auto">
          <div class="flex flex-col-reverse">
            <button
              v-for="{ id, name } in collectionTextArray"
              class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
              :class="
                selectedTextId === id
                  ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                  : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
              "
              @click="selectText(id)"
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
      <div ref="collectionArrayRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="{ id, name } in collectionArray"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              selectedCollectionId === id
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
            "
            @click="selectCollection(id)"
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
const textArrayRef = ref(null)
const textRef = ref(null)
const collectionTextArrayRef = ref(null)
const collectionArrayRef = ref(null)

const textArray = ref([])
const collectionArray = ref([])
const selectedTextId = ref(-1)
const selectedCollectionId = ref(-1)

// handle edit v-model fields
const selectedTextName = ref("")
const selectedTextContent = ref("")
const selectedCollectionName = ref("")

const lastRemovedText = ref(null)
const lastRemovedCollection = ref(null)
const bgTextPositionY = ref("0px")
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 200)

const selectedTextIndex = computed(() => {
  return textArray.value.findIndex(({ id }) => id === selectedTextId.value)
})
const selectedCollectionIndex = computed(() => {
  return collectionArray.value.findIndex(
    ({ id }) => id === selectedCollectionId.value
  )
})
const collectionTextArray = computed(() => {
  if (selectedCollectionId.value === -1) return
  return textArray.value.filter(({ id }) => {
    let match = false
    collectionArray.value[selectedCollectionIndex.value].textIds.forEach(
      (collectionTextId) => {
        if (id === collectionTextId) match = true
      }
    )
    return match
  })
})

onMounted(loadLocalStorageItem)

function createText() {
  const id = generateRandomId()
  textArray.value.push({
    id,
    name: id,
    content: "",
    collectionId: -1,
  })
  selectedTextId.value = id
  updateVModelFields()
  saveLocalStorageItem()
  nextTick(() => {
    textRef.value.focus()
    textArrayRef.value.scrollTop =
      textArrayRef.value.clientHeight - textArrayRef.value.scrollHeight
  })
}
function createCollection() {
  const id = generateRandomId()
  collectionArray.value.push({
    id,
    name: id,
    textIds: new Set(),
  })
  selectedCollectionId.value = id
  updateVModelFields()
  saveLocalStorageItem()
  nextTick(() => {
    collectionArrayRef.value.scrollTop =
      collectionArrayRef.value.clientHeight -
      collectionArrayRef.value.scrollHeight
  })
}
function selectText(id) {
  if (selectedTextId.value === id) {
    deselectText()
    return
  }
  selectedTextId.value = id
  updateVModelFields()
  saveLocalStorageItem()
}
function deselectText() {
  selectedTextId.value = -1
  updateVModelFields()
  saveLocalStorageItem()
}
function selectCollection(id) {
  if (selectedCollectionId.value === id) {
    deselectCollection()
    return
  }
  selectedCollectionId.value = id
  updateVModelFields()
  saveLocalStorageItem()
}
function deselectCollection() {
  selectedCollectionId.value = -1
  updateVModelFields()
  saveLocalStorageItem()
}
function updateVModelFields() {
  if (selectedTextIndex.value !== -1) {
    selectedTextName.value = textArray.value[selectedTextIndex.value].name
    selectedTextContent.value = textArray.value[selectedTextIndex.value].content
  }
  if (selectedCollectionIndex.value !== -1) {
    selectedCollectionName.value =
      collectionArray.value[selectedCollectionIndex.value].name
  }
}
function onInput() {
  const text = textArray.value.find(({ id }) => id === selectedTextId.value)
  if (text) {
    text.name = selectedTextName.value
    text.content = selectedTextContent.value
  }
  const collection = collectionArray.value.find(
    ({ id }) => id === selectedCollectionId.value
  )
  if (collection) collection.name = selectedCollectionName.value
  debouncedSaveLocalStorageItem()
}
function removeText() {
  lastRemovedText.value = textArray.value.splice(selectedTextIndex.value, 1)[0]
  deselectText()
}
function removeCollection() {
  lastRemovedCollection.value = collectionArray.value.splice(
    selectedCollectionIndex.value,
    1
  )[0]
  deselectCollection()
}
function restore() {
  if (lastRemovedText.value) {
    textArray.value.push(lastRemovedText.value)
    selectText(lastRemovedText.value.id)
  } else if (lastRemovedCollection.value) {
    collectionArray.value.push(lastRemovedCollection.value)
    selectCollection(lastRemovedCollection.value.id)
  }
  lastRemovedText.value = null
  lastRemovedCollection.value = null
}
function moveTextUp() {
  const indexCache = selectedTextIndex.value
  if (indexCache === textArray.value.length - 1) return
  const movedText = textArray.value.splice(indexCache, 1)[0]
  textArray.value.splice(indexCache + 1, 0, movedText)
  saveLocalStorageItem()
}
function moveTextDown() {
  const indexCache = selectedTextIndex.value
  if (indexCache === 0) return
  const movedText = textArray.value.splice(indexCache, 1)[0]
  textArray.value.splice(indexCache - 1, 0, movedText)
  saveLocalStorageItem()
}
function moveCollectionUp() {
  const indexCache = selectedCollectionIndex.value
  if (indexCache === collectionArray.value.length - 1) return
  const movedCollection = collectionArray.value.splice(indexCache, 1)[0]
  collectionArray.value.splice(indexCache + 1, 0, movedCollection)
  saveLocalStorageItem()
}
function moveCollectionDown() {
  const indexCache = selectedCollectionIndex.value
  if (indexCache === 0) return
  const movedCollection = collectionArray.value.splice(indexCache, 1)[0]
  collectionArray.value.splice(indexCache - 1, 0, movedCollection)
  saveLocalStorageItem()
}
function pushIntoCollection() {
  if (selectedCollectionId.value === -1) return
  collectionArray.value[selectedCollectionIndex.value].textIds.add(
    selectedTextId.value
  )
  saveLocalStorageItem()
}
function pullFromCollection() {
  if (selectedCollectionId.value === -1) return
  collectionArray.value[selectedCollectionIndex.value].textIds.delete(
    selectedTextId.value
  )
  saveLocalStorageItem()
}
function getStorage() {
  return {
    textArray: textArray.value,
    collectionArray: collectionArray.value.map((collection) => ({
      ...collection,
      textIds: Array.from(collection.textIds),
    })),
    selectedTextId: selectedTextId.value,
    selectedCollectionId: selectedCollectionId.value,
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
  textArray.value = storage.textArray
  collectionArray.value = storage.collectionArray.map((collection) => ({
    ...collection,
    textIds: new Set(collection.textIds),
  }))
  selectedTextId.value = storage.selectedTextId
  selectedCollectionId.value = storage.selectedCollectionId
  if (selectedTextId.value !== -1) nextTick(() => textRef.value.focus())
  updateVModelFields()
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
