<template>
  <div class="flex flex-col flex-1 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top -------------------------------------------------------------->
      <div class="flex justify-between pr-2 bg-stone-700">
        <div class="flex-1 overflow-hidden">
          <input
            ref="pathEl"
            type="text"
            v-model="path"
            @input="dEmitUpdatePath"
            @focus="emit('lock-hotkeys')"
            @blur="emit('unlock-hotkeys')"
            class="min-h-9 max-h-9 focus:bg-stone-800 flex-shrink pb-1 bg-stone-700 pl-3 text-stone-400 truncate hover:bg-stone-800 focus:text-stone-300 hover:text-stone-300"
          />
        </div>
        <div class="flex gap-2">
          <PrettyNum
            :number="getTokensTotal()"
            theme="light"
            class="pt-[5px] w-14"
          />
          <Circles
            v-if="files.length"
            :selected="selected"
            :states="[true, false]"
            @toggle="(state) => emit('toggle-select-all', state)"
          />
          <div v-else class="w-[50px]" />
        </div>
      </div>
      <!-- # list -->
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
              <span class="truncate text-sm">{{ path }}</span>
              <PrettyNum :number="getTokens(content)" theme="light" />
            </ButtonList>
            <Circles
              :selected="selected"
              :index="i"
              :states="[true, false]"
              @toggle="(state) => emit('toggle-select', i, state)"
            />
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
function getTokensTotal() {
  return props.files.reduce((acc, file, i) => {
    if (props.selected[i]) acc += getTokens(file.content)
    return acc
  }, 0)
}
</script>
