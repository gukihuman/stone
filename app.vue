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
          v-for="([key, _], index) in texts"
          :class="
            selectedTextIndex === index
              ? 'bg-stone-400 text-stone-800'
              : 'bg-stone-600 hover:bg-stone-700 text-stone-300'
          "
          @click="selectedTextIndex = index"
        >
          {{ key }}
        </button>
      </div>
    </div>
    <div class="bg-stone-400 flex-grow p-2">
      <textarea
        class="w-full h-full bg-stone-400 py-5 px-6 resize-none focus:outline-none text-stone-800 text-xl"
      ></textarea>
    </div>
    <div class="w-[180px] h-full bg-stone-500"></div>
    <div class="w-[180px] h-full bg-stone-600"></div>
  </div>
</template>
<script setup>
const texts = ref([])
const selectedTextIndex = ref(-1)
function createText() {
  texts.value.push([Math.random().toString().slice(2, 10), ""])
  selectedTextIndex.value = texts.value.length - 1
}
</script>
