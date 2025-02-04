<template>
  <div class="flex justify-between bg-stone-600 h-screen gap-1 p-1">
    <div
      class="bg-stone-500 bg-circles w-[180px] flex flex-col justify-between rounded-lg overflow-hidden"
    >
      <button
        @click="createText"
        class="bg-stone-700 w-full text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
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
      <button
        @click="saveFile"
        class="bg-stone-700 w-full justify-self-end text-stone-300 pb-1 hover:bg-stone-800"
      >
        save
      </button>
      <button
        @click="loadFile"
        class="bg-stone-700 w-full justify-self-end text-stone-300 pb-1 hover:bg-stone-800"
      >
        load
      </button>
      <button
        @click="restore"
        class="w-full bg-stone-700 justify-self-end pb-1"
        :class="
          lastRemovedText
            ? 'hover:bg-stone-800 text-stone-300'
            : 'cursor-default text-stone-500'
        "
      >
        restore
      </button>
    </div>
    <div class="flex flex-col flex-grow">
      <div class="flex flex-col flex-grow" v-show="selectedTextI > -1">
        <div class="flex min-h-9 rounded-t-lg overflow-hidden justify-between">
          <input
            type="text"
            v-model="selectedTextName"
            @input="onInput"
            class="flex-grow bg-circles bg-stone-500 text-center focus:outline-none text-xl text-stone-300"
          />
          <button
            v-if="selectedTextI !== -1"
            @click="remove"
            class="bg-stone-700 px-5 justify-self-end text-stone-300 pb-1 hover:bg-stone-800"
          >
            remove
          </button>
        </div>
        <textarea
          ref="textRef"
          v-model="selectedText"
          @input="onInput"
          @scroll="handleScroll"
          class="flex-grow h-full bg-lines bg-stone-400 pt-7 p-8 resize-none focus:outline-none text-stone-800 text-xl rounded-b-lg"
          :style="{ backgroundPositionY }"
        ></textarea>
      </div>
    </div>
    <div class="w-[180px] rounded-lg h-full bg-circles bg-stone-500"></div>
    <div class="w-[180px] rounded-lg h-full bg-circles bg-stone-500"></div>
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
const backgroundPositionY = ref("0px")
const lastRemovedText = ref(null)
onMounted(loadLocalStorageItem)

function handleScroll(event) {
  backgroundPositionY.value = `-${event.target.scrollTop}px`
}
function getStorage() {
  return {
    textArray: textArray.value,
    selectedTextI: selectedTextI.value,
  }
}
function onInput() {
  textArray.value[selectedTextI.value][0] = selectedTextName.value
  textArray.value[selectedTextI.value][1] = selectedText.value
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
function createText() {
  selectedTextName.value = Math.random().toString().slice(2, 10)
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
  const date = new Date()
  const dateString = date.toISOString().slice(0, 10) // YYYY-MM-DD
  a.download = `stone-${dateString}.json`
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
function loadFile() {
  let fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.style.display = "none"
  fileInput.onchange = (event) => {
    const file = event.target.files[0]
    if (file) {
      let reader = new FileReader()
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
function remove() {
  lastRemovedText.value = textArray.value.splice(selectedTextI.value, 1)[0]
  deselectText()
}
function restore() {
  if (!lastRemovedText.value) return
  textArray.value.push(lastRemovedText.value)
  lastRemovedText.value = null
  selectText(textArray.value.length - 1)
}
function injectStorage(storage) {
  textArray.value = storage.textArray
  selectedTextI.value = storage.selectedTextI
  if (selectedTextI.value === -1) return
  selectedTextName.value = textArray.value[selectedTextI.value][0]
  selectedText.value = textArray.value[selectedTextI.value][1]
  nextTick(() => textRef.value.focus())
}
</script>
