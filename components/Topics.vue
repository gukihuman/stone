<template>
  <div class="w-[250px] flex flex-col gap-3 flex-shrink-0">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top menu --------------------------------------------------------->
      <div class="flex bg-stone-700">
        <ButtonArrow
          @click="emit('sort-down')"
          :disabled="focusedIndex === null || focusedIndex === 0"
          direction="down"
        />
        <ButtonArrow
          @click="emit('sort-up')"
          :disabled="
            focusedIndex === null || focusedIndex === topics.length - 1
          "
          direction="up"
        />
        <button
          @click="emit('new-topic')"
          class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
        >
          new
        </button>
        <div
          v-if="selected.length"
          class="flex-shrink-0 flex items-center justify-center cursor-pointer px-3"
          @click="emit('toggle-select-all')"
        >
          <div
            class="flex items-center justify-center rounded-full size-5 bg-stone-600"
          >
            <div
              class="rounded-full size-3"
              :class="{ 'bg-stone-300/80': selected.every((is) => is) }"
            />
          </div>
        </div>
        <div v-else class="w-[82px]" />
      </div>
      <!-- # list ------------------------------------------------------------->
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col-reverse">
          <div
            class="flex max-w-full"
            v-for="(topic, i) in topics"
            :key="`topic${i}`"
          >
            <ButtonList
              :active="focusedIndex === i"
              @click="emit('toggle-focus', i)"
            >
              <span class="truncate">{{ topic }}</span>
            </ButtonList>
            <div
              class="flex-shrink-0 flex items-center justify-center cursor-pointer pl-3 pr-1"
              @click="emit('toggle-select', i)"
            >
              <div
                class="flex items-center justify-center rounded-full size-5 bg-stone-600"
              >
                <div
                  class="rounded-full size-3"
                  :class="{ 'bg-stone-300/80': selected[i] }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["topics", "selected", "focusedIndex"])
const emit = defineEmits([
  "new-topic",
  "toggle-focus",
  "toggle-select",
  "toggle-select-all",
  "sort-up",
  "sort-down",
])

// els refs
const listEl = ref(null)
</script>
