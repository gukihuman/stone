<template>
  <div
    class="w-[250px] overflow-hidden flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg"
  >
    <!-- events menu top -->
    <div class="flex">
      <button
        @click="onClickNew"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
    </div>
    <!-- event list -->
    <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
      <div class="flex flex-col-reverse">
        <div v-for="({ name }, index) in events" :key="`event-${index}`">
          <ButtonList
            :active="focusedEventIndex === index"
            @click="emit('toggle-event-focus', index)"
          >
            <span class="truncate">{{ name }}</span>
          </ButtonList>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["events", "focusedEventIndex"])
const emit = defineEmits(["new-event", "toggle-event-focus"])

const listEl = ref(null)

function onClickNew() {
  scrollToTop(listEl.value)
  emit("new-event")
}
</script>
