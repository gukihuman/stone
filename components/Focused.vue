<template>
  <div
    class="flex w-full flex-col items-center bg-circles rounded-lg bg-stone-500 overflow-hidden"
  >
    <!------------------------- edit menu top --------------------------------->
    <div
      class="w-full bg-stone-700 items-center flex min-h-11 rounded-t-lg overflow-hidden"
    >
      <input
        ref="nameEl"
        type="text"
        v-model="name"
        @input="dEmitUpdateItem('name', name)"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="h-full focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-xl text-stone-300 truncate hover:bg-stone-800"
      />
      <p
        class="focus:bg-stone-800 focus:text-stone-300 flex-grow px-7 pb-1 bg-stone-700 text-center pt-[2px] text-stone-400 truncate cursor-default"
      >
        {{ item.date.substring(0, 10) }}
      </p>
    </div>
    <!-------------------------- textarea ------------------------------------->
    <div
      class="w-full relative h-full p-3"
      :class="[isTextareaFocused ? 'bg-stone-700' : '']"
    >
      <div class="relative overflow-hidden rounded-xl h-full">
        <textarea
          ref="textareaEl"
          :key="`textarea-${field}`"
          v-model="textarea"
          @input="onTextareaInput"
          @scroll="onScroll"
          @focus="onFocus"
          @blur="onBlur"
          class="w-full h-full py-5 px-8 scroll-light bg-lines resize-none text-xl"
          :class="
            field === 'text'
              ? 'bg-stone-400 text-stone-800'
              : 'bg-stone-600 bg-lines-light selection-light text-stone-300'
          "
          :style="{ backgroundPositionY: linesOffset }"
        />
      </div>
    </div>
    <!------------------------ edit menu bot ---------------------------------->
    <div class="flex flex-col w-full bg-stone-700">
      <!-- <div
        class="flex px-3 py-2 border-stone-600 border-b-[3px] border-dashed"
        v-if="editEventId"
      >
        <div class="flex gap-2 w-[330px] justify-end">
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
        <Switch v-model="field" :fields="fields" @change="onSwitchChange" />
        <ButtonLight @click="emit('remove-item')"> remove</ButtonLight>
      </div>
    </div>
  </div>
</template>

<script setup>
// constants
const ADJUST_SCROLL = 24
const LINES_OFFSET = -8

// connect
const props = defineProps(["item", "field", "fields"])
const emit = defineEmits([
  "update-item",
  "remove-item",
  "update-app-state",
  "lock-hotkeys",
  "unlock-hotkeys",
])

// refs
const nameEl = ref(null)
const textareaEl = ref(null)

// reactive
const isTextareaFocused = ref(false)
const linesOffset = ref(`${LINES_OFFSET}px`)

// v-model
const name = ref(props.item.name)
const field = ref(props.field)
const textarea = ref(props.item[props.field])

// vue logic
watch(props.item, (newValue) => {
  name.value = newValue.name
  textarea.value = newValue[field.value]
})
defineExpose({ textareaEl, focusName, focusBot, focusTop })

///////////////////////////////// functions ////////////////////////////////////
const dEmitUpdateItem = debounce((key, v) => emit("update-item", [key, v]))

function onTextareaInput(event) {
  dEmitUpdateItem(field.value, event.target.value)
  adjustScrollTop()
}
function onSwitchChange() {
  textarea.value = props.item[field.value]
  emit("update-app-state", "focusedField", field.value)
}
function onFocus() {
  isTextareaFocused.value = true
  emit("lock-hotkeys")
}
function onBlur() {
  isTextareaFocused.value = false
  emit("unlock-hotkeys")
}
function focusName() {
  nameEl.value.focus()
  nameEl.value.setSelectionRange(0, nameEl.value.value.length)
}
function focusBot() {
  textareaEl.value.focus()
  const length = textareaEl.value.value.length
  textareaEl.value.setSelectionRange(length, length)
  scrollToBot(textareaEl.value, "auto")
}
function focusTop() {
  textareaEl.value.focus()
  textareaEl.value.setSelectionRange(0, 0)
  scrollToTop(textareaEl.value, "auto")
}
function onScroll(event) {
  event
    ? (linesOffset.value = `-${event.target.scrollTop - LINES_OFFSET}px`)
    : (linesOffset.value = `${LINES_OFFSET}px`)
}
function adjustScrollTop() {
  const el = textareaEl.value
  const initialScrollTop = el.scrollTop
  requestAnimationFrame(() => {
    if (el.scrollTop < initialScrollTop) {
      el.scrollTop = Math.max(0, el.scrollTop - ADJUST_SCROLL)
    } else if (el.scrollTop > initialScrollTop) {
      el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + ADJUST_SCROLL)
    }
  })
}
</script>
