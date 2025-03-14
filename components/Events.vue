<template>
  <div
    class="w-[250px] overflow-hidden flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg"
  >
    <!-- # top menu ----------------------------------------------------------->
    <div class="flex">
      <button
        @click="onClickNew"
        class="bg-stone-700 w-full text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
    </div>
    <!-- # list --------------------------------------------------------------->
    <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
      <div class="flex flex-col-reverse">
        <div v-for="({ name, text }, index) in events" :key="`event-${index}`">
          <ButtonList
            :active="focusedIndex === index"
            @click="emit('toggle-event-focus', index)"
          >
            <span class="truncate">{{ name }}</span>
            <PrettyNum :number="getTokens(text)" theme="light" />
          </ButtonList>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["events", "focusedIndex"])
const emit = defineEmits(["new-event", "toggle-event-focus"])

const listEl = ref(null)

////////////////////////////////////////////////////////////////////////////////
function onClickNew() {
  scrollToTop(listEl.value)
  emit("new-event")
}
</script>
