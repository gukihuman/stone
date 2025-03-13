<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
  >
    <!-- # top ---------------------------------------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden"
    >
      <input
        ref="nameEl"
        type="text"
        v-model="name"
        @input="dEmitUpdateTopic"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
    </div>
    <!-- # mid --------------------------------------------------------------->
    <div class="flex-grow" />
    <!-- # bot ---------------------------------------------------------------->
    <div class="flex flex-col w-full bg-stone-700">
      <div class="flex p-3 justify-end">
        <ButtonLight @click="emit('remove-topic')"> remove</ButtonLight>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["topic"])
const emit = defineEmits([
  "update-topic",
  "remove-topic",
  "lock-hotkeys",
  "unlock-hotkeys",
])

const { focusName } = useFocused()

// els refs
const nameEl = ref(null)

// v-model
const name = ref(props.topic)

defineExpose({
  focusName: () => focusName(nameEl),
})

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdateTopic = debounce(() => emit("update-topic", name.value))
</script>
