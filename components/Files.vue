<template>
  <div class="w-[290px] flex flex-col max-h-[300px]">
    <!-- # top ---------------------------------------------------------------->
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <input
        ref="pathEl"
        type="text"
        v-model="path"
        @input="dEmitUpdatePath"
        @focus="emit('lock-hotkeys')"
        @blur="emit('unlock-hotkeys')"
        class="min-h-9 focus:bg-stone-800 flex-grow px-7 pb-1 bg-stone-700 text-center text-lg text-stone-400 truncate hover:bg-stone-800 focus:text-stone-300 hover:text-stone-300"
      />
      <div ref="listEl" class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col">
          <div
            class="flex max-w-full"
            v-for="({ path, content }, i) in files"
            :key="`file-${i}`"
          >
            <ButtonList
              :active="focusedIndex === i"
              @click="emit('toggle-focus', i)"
            >
              <span class="truncate">{{ path }}</span>
              <PrettyNum :number="getTokens(content)" theme="light" />
            </ButtonList>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["files", "path", "selected", "focusedIndex"])
const emit = defineEmits([
  "toggle-focus",
  "toggle-select",
  "toggle-select-all",
  "update-path",
  "lock-hotkeys",
  "unlock-hotkeys",
])

// els refs
const pathEl = ref(null)

// v-model
const path = ref(props.path)

defineExpose({ focusPath: () => focusPath(pathEl) })

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdatePath = debounce(() => emit("update-path", path.value))

function focusPath(pathEl) {
  pathEl.value.focus()
  pathEl.value.setSelectionRange(0, pathEl.value.value.length)
}
</script>
