<template>
  <div class="flex justify-between h-screen">
    <div class="bg-stone-500 w-[180px] flex flex-col gap-1 justify-between">
      <button
        @click="createText"
        class="bg-stone-700 w-full text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div class="overflow-auto flex flex-col gap-1 flex-grow">
        <button
          v-for="([key, _], index) in textArray"
          :class="
            selectedTextI === index
              ? 'bg-stone-400 text-stone-800'
              : 'bg-stone-600 hover:bg-stone-700 text-stone-300'
          "
          @click="selectText(index)"
        >
          {{ key }}
        </button>
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
    </div>
    <textarea
      ref="textRef"
      :disabled="selectedTextI === -1"
      v-model="selectedText"
      @input="onInput"
      class="flex-grow h-full bg-stone-400 py-6 px-8 resize-none focus:outline-none text-stone-800 text-xl"
    ></textarea>
    <div class="w-[180px] h-full bg-stone-500"></div>
    <div class="w-[180px] h-full bg-stone-600"></div>
  </div>
</template>
<script setup>
import { debounce } from "lodash"
const LOCAL_STORAGE_KEY = "stone"
const textRef = ref(null)
const textArray = ref([])
const selectedTextI = ref(-1)
const selectedText = ref("")
function getStorage() {
  return {
    textArray: textArray.value,
    selectedTextI: selectedTextI.value,
  }
}
const onInput = debounce(() => {
  textArray.value[selectedTextI.value][1] = selectedText.value
  saveLocalStorageItem()
}, 200)
onMounted(() => {
  const rawStorage = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (rawStorage) {
    const storage = JSON.parse(rawStorage)
    loadLocalStorageItem(storage)
  }
})
function selectText(index) {
  selectedTextI.value = index
  selectedText.value = textArray.value[index][1]
  saveLocalStorageItem()
  nextTick(() => textRef.value.focus())
}
function createText() {
  textArray.value.push([Math.random().toString().slice(2, 10), ""])
  selectedTextI.value = textArray.value.length - 1
  selectedText.value = ""
  saveLocalStorageItem()
  nextTick(() => textRef.value.focus())
}
function saveLocalStorageItem() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getStorage()))
}
// 📜 rename storage variable everywhere, think of a better solution
function loadLocalStorageItem(storage) {
  textArray.value = storage.textArray
  selectedTextI.value = storage.selectedTextI
  selectedText.value = textArray.value[selectedTextI.value][1]
  nextTick(() => textRef.value.focus())
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
          loadLocalStorageItem(JSON.parse(e.target.result))
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
</script>
