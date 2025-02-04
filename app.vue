<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <!--------------------------- Texts Column -------------------------------->
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <!---------------------------- New Text --------------------------------->
      <button
        @click="createText"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <!--------------------------- Text List --------------------------------->
      <div ref="textArrayRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="([key, _], index) in textArray"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              selectedTextI === index
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
            "
            @click="selectText(index)"
          >
            {{ key }}
          </button>
        </div>
      </div>
      <!---------------------- Save / Load / Restore -------------------------->
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
    <!------------------------------- Paper ----------------------------------->
    <div class="flex flex-col flex-grow">
      <div
        class="flex flex-col flex-grow overflow-hidden rounded-lg"
        v-show="selectedTextI > -1"
      >
        <div class="flex min-h-11 rounded-t-lg overflow-hidden justify-between">
          <!----------------------- Text Move --------------------------------->
          <button
            @click="moveTextDown"
            class="max-h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
            :class="
              selectedTextI === 0
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
              selectedTextI === textArray.length - 1
                ? 'cursor-default bg-slate-50 text-stone-500/60'
                : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
            "
          >
            <Arrow class="w-3 -rotate-90" />
          </button>
          <!----------------------- Text Name --------------------------------->
          <input
            type="text"
            v-model="selectedTextName"
            @input="onInput"
            class="z-10 rounded-bl-2xl flex-grow px-7 pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
        </div>
        <!--------------------------- Text ------------------------------------>
        <textarea
          ref="textRef"
          v-model="selectedText"
          @input="onInput"
          @scroll="handleScroll"
          class="-mt-4 -mb-7 h-full bg-lines scroll-light bg-stone-400 pt-7 p-8 resize-none focus:outline-none text-stone-800 text-xl rounded-b-lg"
          :style="{ backgroundPositionY }"
        ></textarea>
        <!------------------------ Remove Text -------------------------------->
        <button
          @click="removeText"
          class="max-h-7 w-full bg-stone-700 justify-self-end text-stone-400 pb-1 hover:bg-stone-800 self-end hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <!------------------------ Collection Column ------------------------------>
    <div class="w-[180px] h-full">
      <div
        class="bg-stone-500 bg-circles w-full h-full flex flex-col justify-between rounded-lg overflow-hidden"
        v-show="selectedCollectionI > -1"
      >
        <div class="flex">
          <!--------------------- Collection Name ----------------------------->
          <input
            type="text"
            v-model="selectedCollectionName"
            @input="onInput"
            class="z-10 rounded-br-xl px-4 h-11 w-[108px] pb-1 bg-stone-700 text-center focus:outline-none text-xl text-stone-300 truncate"
          />
          <!-------------------- Collection Move ------------------------------>
          <div class="h-7 flex justify-end bg-stone-700">
            <button
              @click="moveCollectionDown"
              class="h-7 bg-stone-700 pt-[3px] px-3 justify-self-end text-stone-300 pb-1"
              :class="
                selectedCollectionI === 0
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
                selectedCollectionI === collectionArray.length - 1
                  ? 'cursor-default bg-slate-50 text-stone-500/60'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-300'
              "
            >
              <Arrow class="w-3 -rotate-90" />
            </button>
          </div>
        </div>
        <div class="flex-grow"></div>
        <!---------------------- Remove Collection ---------------------------->
        <button
          @click="removeCollection"
          class="max-h-7 w-full bg-stone-700 self-end text-stone-400 pb-1 hover:bg-stone-800 hover:text-stone-300"
        >
          remove
        </button>
      </div>
    </div>
    <!---------------------- Collections List Column -------------------------->
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <!------------------------ New Collection ------------------------------->
      <button
        @click="createCollection"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <!----------------------- Collection List ------------------------------->
      <div ref="collectionArrayRef" class="flex-grow overflow-auto">
        <div class="flex flex-col-reverse">
          <button
            v-for="([key, _], index) in collectionArray"
            class="py-[2px] pr-1 text-left min-h-7 text-shadow truncate outline-none"
            :class="
              selectedCollectionI === index
                ? 'pl-5 bg-gradient-to-r from-stone-600 to-transparent  text-stone-300'
                : 'pl-3 hover:bg-gradient-to-r hover:from-stone-600/50 hover:to-transparent  text-stone-300'
            "
            @click="selectCollection(index)"
          >
            {{ key }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash"
const LOCAL_STORAGE_KEY = "stone"

const textRef = ref(null)
const textArrayRef = ref(null)
const textArray = ref([])
const selectedTextI = ref(-1)
const selectedText = ref("")
const selectedTextName = ref("")

const collectionArrayRef = ref(null)
const collectionArray = ref([])
const selectedCollectionI = ref(-1)
const selectedCollection = ref([])
const selectedCollectionName = ref("")

const backgroundPositionY = ref("0px")
const lastRemovedText = ref(null)
const lastRemovedCollection = ref(null)
onMounted(loadLocalStorageItem)

function handleScroll(event) {
  backgroundPositionY.value = `-${event.target.scrollTop}px`
}
function getStorage() {
  return {
    textArray: textArray.value,
    selectedTextI: selectedTextI.value,
    collectionArray: collectionArray.value,
    selectedCollectionI: selectedCollectionI.value,
  }
}
function onInput() {
  textArray.value[selectedTextI.value][0] = selectedTextName.value
  textArray.value[selectedTextI.value][1] = selectedText.value
  collectionArray.value[selectedCollectionI.value][0] =
    selectedCollectionName.value
  collectionArray.value[selectedCollectionI.value][1] = selectedCollection.value
  debouncedSaveLocalStorageItem()
}
function selectText(index) {
  if (selectedTextI.value === index) {
    deselectText()
    return
  }
  selectedTextI.value = index
  selectedTextName.value = textArray.value[index][0]
  selectedText.value = textArray.value[index][1]
  saveLocalStorageItem()
}
function deselectText() {
  selectedTextI.value = -1
  selectedText.value = ""
  saveLocalStorageItem()
}
function selectCollection(index) {
  if (selectedCollectionI.value === index) {
    deselectCollection()
    return
  }
  selectedCollectionI.value = index
  selectedCollectionName.value = collectionArray.value[index][0]
  selectedCollection.value = collectionArray.value[index][1]
  saveLocalStorageItem()
}
function deselectCollection() {
  selectedCollectionI.value = -1
  selectedCollection.value = ""
  saveLocalStorageItem()
}
function createText() {
  selectedTextName.value = generateRandomName()
  textArray.value.push([selectedTextName.value, ""])
  selectedTextI.value = textArray.value.length - 1
  selectedText.value = ""
  saveLocalStorageItem()
  nextTick(() => {
    textRef.value.focus()
    textArrayRef.value.scrollTop =
      textArrayRef.value.clientHeight - textArrayRef.value.scrollHeight
  })
}
function createCollection() {
  selectedCollectionName.value = generateRandomName()
  collectionArray.value.push([selectedCollectionName.value, ""])
  selectedCollectionI.value = collectionArray.value.length - 1
  selectedCollection.value = ""
  saveLocalStorageItem()
  nextTick(() => {
    collectionArrayRef.value.scrollTop =
      collectionArrayRef.value.clientHeight -
      collectionArrayRef.value.scrollHeight
  })
}
function generateRandomName() {
  return Math.random().toString().slice(2, 10)
}
function saveLocalStorageItem() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getStorage()))
}
const debouncedSaveLocalStorageItem = _.debounce(saveLocalStorageItem, 200)
function loadLocalStorageItem() {
  const rawStorage = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (rawStorage) injectStorage(JSON.parse(rawStorage))
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
function removeText() {
  lastRemovedText.value = textArray.value.splice(selectedTextI.value, 1)[0]
  deselectText()
}
function removeCollection() {
  lastRemovedCollection.value = collectionArray.value.splice(
    selectedCollectionI.value,
    1
  )[0]
  deselectCollection()
}
function restore() {
  if (lastRemovedText.value) {
    textArray.value.push(lastRemovedText.value)
    selectText(textArray.value.length - 1)
  } else if (lastRemovedCollection.value) {
    collectionArray.value.push(lastRemovedCollection.value)
    selectCollection(collectionArray.value.length - 1)
  }
  lastRemovedText.value = null
  lastRemovedCollection.value = null
}
function injectStorage(storage) {
  textArray.value = storage.textArray
  selectedTextI.value = storage.selectedTextI
  if (selectedTextI.value !== -1) {
    selectedTextName.value = textArray.value[selectedTextI.value][0]
    selectedText.value = textArray.value[selectedTextI.value][1]
    nextTick(() => textRef.value.focus())
  }
  collectionArray.value = storage.collectionArray
  selectedCollectionI.value = storage.selectedCollectionI
  if (selectedCollectionI.value !== -1) {
    selectedCollectionName.value =
      collectionArray.value[selectedCollectionI.value][0]
    selectedCollection.value =
      collectionArray.value[selectedCollectionI.value][1]
  }
}
function moveTextUp() {
  if (selectedTextI.value === textArray.value.length - 1) return
  const movedText = textArray.value.splice(selectedTextI.value, 1)[0]
  textArray.value.splice(selectedTextI.value + 1, 0, movedText)
  selectedTextI.value++
  saveLocalStorageItem()
}
function moveTextDown() {
  if (selectedTextI.value === 0) return
  const movedText = textArray.value.splice(selectedTextI.value, 1)[0]
  textArray.value.splice(selectedTextI.value - 1, 0, movedText)
  selectedTextI.value--
  saveLocalStorageItem()
}
function moveCollectionUp() {
  if (selectedCollectionI.value === collectionArray.value.length - 1) return
  const movedCollection = collectionArray.value.splice(
    selectedCollectionI.value,
    1
  )[0]
  collectionArray.value.splice(
    selectedCollectionI.value + 1,
    0,
    movedCollection
  )
  selectedCollectionI.value++
  saveLocalStorageItem()
}
function moveCollectionDown() {
  if (selectedCollectionI.value === 0) return
  const movedCollection = collectionArray.value.splice(
    selectedCollectionI.value,
    1
  )[0]
  collectionArray.value.splice(
    selectedCollectionI.value - 1,
    0,
    movedCollection
  )
  selectedCollectionI.value--
  saveLocalStorageItem()
}
</script>
