<template>
  <div
    class="overflow-y-auto flex-shrink-0 flex flex-col bg-circles bg-stone-500 rounded-lg flex-[18%]"
  >
    <!-- # top menu ----------------------------------------------------------->
    <div class="flex gap-2 pr-2 bg-stone-700">
      <button
        @click="onClickNew"
        class="flex-grow text-stone-400 hover:text-stone-300 pb-1 hover:bg-stone-800"
      >
        new
      </button>
      <PrettyNum
        :number="getTokensTotal()"
        theme="dark"
        class="cursor-default w-14 pt-[2px]"
      />
      <div v-if="selected.length" class="flex">
        <Circles
          :selected="selected"
          :states="[true, false]"
          @toggle="(state) => emit('toggle-select-all', state)"
        />
      </div>
      <div v-else class="w-[50px]" />
    </div>
    <!-- # list --------------------------------------------------------------->
    <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
      <div class="flex flex-col-reverse">
        <div
          v-for="({ name, text, memory }, i) in events"
          :key="`event-${i}`"
          class="flex gap-1"
        >
          <ButtonList
            :active="focusedIndex === i"
            @click="emit('toggle-focus', i)"
            theme="sm-padding"
          >
            <div class="flex overflow-hidden gap-1">
              <div class="min-w-4">
                {{ getPrefix(memory) }}
              </div>
              <span class="truncate"> {{ name }}</span>
            </div>
            <PrettyNum
              v-if="selected[i] || focusedIndex === i"
              :number="getTokens(text)"
              theme="light"
            />
          </ButtonList>
          <Circles
            :selected="selected"
            :index="i"
            :states="[true, false]"
            :focused="focusedIndex === i"
            @toggle="
              (state) =>
                focusedIndex !== i ? emit('toggle-select', i, state) : {}
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["events", "focusedIndex", "selected"])
const emit = defineEmits([
  "new-event",
  "toggle-focus",
  "toggle-select",
  "toggle-select-all",
])

const listEl = ref(null)

////////////////////////////////////////////////////////////////////////////////
function onClickNew() {
  scrollToTop(listEl.value)
  emit("new-event")
}
function getTokensTotal() {
  return props.events.reduce((acc, event, i) => {
    if (props.selected[i]) acc += getTokens(event.text)
    return acc
  }, 0)
}
function getPrefix(memory) {
  console.log(memory)
  if (memory.jane && memory.rox) return "▷░"
  if (memory.jane) return "░ "
  if (memory.rox) return "▷ "
  return ""
}
</script>
