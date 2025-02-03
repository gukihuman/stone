<template>
  <div class="flex justify-between h-screen">
    <div class="bg-stone-500 w-[180px] flex flex-col gap-1">
      <button
        @click="createText"
        class="bg-stone-700 w-full text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <div class="overflow-auto flex flex-col gap-1">
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
    </div>
    <div class="bg-stone-400 flex-grow p-2">
      <textarea
        ref="textRef"
        v-show="selectedTextI !== -1"
        v-model="selectedText"
        @input="onInput"
        class="w-full h-full bg-stone-400 py-5 px-6 resize-none focus:outline-none text-stone-800 text-xl"
      ></textarea>
    </div>
    <div class="w-[180px] h-full bg-stone-500"></div>
    <div class="w-[180px] h-full bg-stone-600"></div>
  </div>
</template>
<script setup>
import { debounce } from "lodash"
const LS = {
  TEXT_ARRAY: "stone-text-array",
  SELECTED_TEXT_I: "stone-selected-text-i",
}
const textRef = ref(null)
const textArray = ref([])
const selectedTextI = ref(-1)
const selectedText = ref("")
const onInput = debounce(() => {
  textArray.value[selectedTextI.value][1] = selectedText.value
  setLocalStorageItem()
}, 200)
onMounted(() => {
  const storedTexts = localStorage.getItem(LS.TEXT_ARRAY)
  if (storedTexts) textArray.value = JSON.parse(storedTexts)
  const storedSelectedTextI = localStorage.getItem(LS.SELECTED_TEXT_I)
  if (storedSelectedTextI) {
    selectedTextI.value = JSON.parse(storedSelectedTextI)
    selectedText.value = textArray.value[selectedTextI.value][1]
    textRef.value.focus()
  }
})
function selectText(index) {
  selectedTextI.value = index
  selectedText.value = textArray.value[index][1]
  setLocalStorageItem()
  textRef.value.focus()
}
function createText() {
  textArray.value.push([Math.random().toString().slice(2, 10), ""])
  selectedTextI.value = textArray.value.length - 1
  selectedText.value = ""
  setLocalStorageItem()
  textRef.value.focus()
}
function setLocalStorageItem() {
  localStorage.setItem(LS.TEXT_ARRAY, JSON.stringify(textArray.value))
  localStorage.setItem(LS.SELECTED_TEXT_I, JSON.stringify(selectedTextI.value))
}
</script>
