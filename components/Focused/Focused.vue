<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
  >
    <!-- edit menu top -->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden"
    >
      <input
        ref="nameEl"
        type="text"
        v-model="name"
        @input="debouncedEmitUpdateName"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
      <p
        class="focus:bg-stone-800 focus:text-stone-300 flex-grow px-7 pb-1 bg-stone-700 text-center pt-[2px] text-stone-400 truncate cursor-default"
      >
        {{ event.date.substring(0, 10) }}
      </p>
    </div>
    <div class="flex-grow"></div>
    <!-- <FocusedScreen
      ref="screenEl"
      v-if="
        editEventId
          ? editEventMod === EVENT_MODS.TEXT ||
            editEventMod === EVENT_MODS.MEMORY_RAW
          : editTopicMod === TOPIC_MODS.MEMORY_IDS_RAW
      "
      v-model="screen"
      @focus="isAnyInputFocused = true"
      @blur="isAnyInputFocused = false"
      :lock-hotkeys="isAnyInputFocused"
      :update="`${editEventMod}${editEventId}${editTopicId}`"
      :theme="
        editTopicId || editEventMod === EVENT_MODS.MEMORY_RAW ? 'dark' : 'light'
      "
    /> -->
    <!-- <Records
      v-else
      @focus="isAnyInputFocused = true"
      @blur="isAnyInputFocused = false"
      :memory-records-by-id="memoryRecordsById"
      :events-by-id="eventsById"
      :topics-by-id="topicsById"
      :edit-event-id="editEventId"
      :edit-topic-id="editTopicId"
      :lock-hotkeys="isAnyInputFocused"
      :update="`${editEventMod}${editEventId}${editTopicId}`"
      theme="light"
      @local-storage-save="debouncedLocalStorageSave"
    /> -->
    <!-- edit menu bot -->
    <div class="flex flex-col w-full bg-stone-700">
      <!-- <div
        class="flex px-3 py-2 border-stone-600 border-b-[3px] border-dashed"
        v-if="editEventId"
      >
        <div class="flex gap-2 w-[330px] justify-end">
          <div class="pt-[3px]">
            <Binary
              v-if="tokensForNow"
              :groups="toBinaryGroups(tokensForNow)"
              theme="light"
            />
          </div>
          <span class="text-stone-400 leading-[19px] self-end"> now </span>
          <ButtonLight @click="onCopyNow" :disabled="copyLockedNow">
            copy
          </ButtonLight>
          <ButtonLight @click="onGenNow" :disabled="genNowLocked">
            gen
          </ButtonLight>
        </div>
      </div> -->
      <div class="flex p-3 justify-between">
        <!-- <Switch
          v-if="editEventId"
          v-model="editEventMod"
          :labels="editEventModLabels"
          @change="onEditModChange"
        />
        <Switch
          v-else
          v-model="editTopicMod"
          :labels="editTopicModLabels"
          @change="onEditModChange"
        /> -->
        <!-- <div v-if="editEventId" class="flex gap-2 flex-grow pr-10 justify-end">
          <div class="pt-[3px]">
            <Binary
              v-if="tokensForMakeMemory"
              :groups="toBinaryGroups(tokensForMakeMemory)"
              theme="light"
            />
          </div>
          <span class="text-stone-400 leading-[19px] self-end"> make </span>
          <ButtonLight
            @click="onCopyMakeMemory"
            :disabled="copyLockedMakeMemory"
          >
            copy
          </ButtonLight>
          <ButtonLight @click="onGenMakeMemory" :disabled="genMakeMemoryLocked">
            gen
          </ButtonLight>
        </div>
        <div v-else class="flex gap-2 flex-grow pr-10 justify-end">
          <div class="pt-[3px]">
            <Binary
              v-if="tokensForMakeTopicIds"
              :groups="toBinaryGroups(tokensForMakeTopicIds)"
              theme="light"
            />
          </div>
          <span class="text-stone-400 leading-[19px] self-end"> make </span>
          <ButtonLight
            @click="onCopyMakeTopicIds"
            :disabled="copyLockedMakeTopicIds"
          >
            copy
          </ButtonLight>
          <ButtonLight
            @click="onGenMakeTopicIds"
            :disabled="genMakeTopicIdsLocked"
          >
            gen
          </ButtonLight>
        </div> -->
        <ButtonLight @click="emit('remove')"> remove </ButtonLight>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["event"])
const emit = defineEmits([
  "update-name",
  "remove",
  "lock-hotkeys",
  "unlock-hotkeys",
])

// const EVENT_MOD = { TEXT: 0, MEMORY_RAW: 1 }
// const eventMod = ref(EVENT_MOD.TEXT)
// const eventModLabels = {
//   text: EVENT_MOD.TEXT,
//   memoryRaw: EVENT_MOD.MEMORY_RAW,
//   memory: EVENT_MOD.MEMORY,
// }

const nameEl = ref(null)
// const screenEl = ref(null)

const name = ref(props.event.name)
// const screen = ref("")

const debouncedEmitUpdateName = debounce(() => emit("update-name", name.value))

watch(
  () => props.event.name,
  (newValue) => (name.value = newValue)
)
defineExpose({ focusName })

function focusName() {
  nameEl.value.focus()
  nameEl.value.setSelectionRange(0, nameEl.value.value.length)
}

// function updateOnInput() {
//   const editEvent = eventsById.value[focusedEventIndex.value]
//   if (editEvent) {
//     editEvent.name = name.value
//     editEvent.date = date.value
//     if (eventMod.value === EVENT_MOD.MEMORY_RAW) {
//       editEvent.memoryRecordsRaw = screen.value
//       debouncedUpdateMemories(editEvent)
//     } else {
//       editEvent.text = screen.value
//     }
//   }
//   const editTopic = topicsById.value[editTopicId.value]
//   if (editTopic) {
//     editTopic.name = name.value
//     editTopic.memoryIdsRaw = screen.value
//     debouncedUpdateTopics(editTopic)
//   }
//   debouncedLocalStorageSave()
// }
</script>
