<template>
  <div class="flex flex-col flex-1 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <!-- # top -------------------------------------------------------------->
      <div class="flex justify-between gap-2 pr-2 bg-stone-700">
        <div class="flex-grow overflow-hidden">
          <input
            ref="pathEl"
            type="text"
            v-model="path"
            @input="dEmitUpdatePath"
            @focus="emit('lock-hotkeys')"
            @blur="emit('unlock-hotkeys')"
            class="min-h-9 max-h-9 w-full focus:bg-stone-800 flex-shrink pb-1 bg-stone-700 pl-3 text-stone-400 truncate hover:bg-stone-800 focus:text-stone-300 hover:text-stone-300"
          />
        </div>
        <div class="flex gap-2">
          <PrettyNum
            v-if="getTokensTotal()"
            :number="getTokensTotal()"
            theme="light"
            class="pt-[5px]"
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
      <!-- # list ------------------------------------------------------------->
      <div
        ref="listEl"
        class="overflow-y-scroll pb-2 flex-grow flex flex-col gap-3 pt-2"
      >
        <div
          v-for="(group, groupIndex) in groupedFiles"
          :key="`group-${groupIndex}`"
          class="flex flex-col"
        >
          <div
            class="flex items-end pl-3 text-stone-350 text-sm cursor-default"
          >
            {{ group.folder }}
          </div>
          <div
            class="flex max-w-full gap-1"
            v-for="{ file, index } in group.files"
            :key="`file-${index}`"
          >
            <ButtonList
              :active="focusedIndex === index"
              @click="emit('toggle-focus', index)"
            >
              <span class="truncate">
                {{ getParts(file.path).file }}
              </span>
              <PrettyNum
                v-if="selected[index]"
                :number="getTokens(file.content)"
                theme="light"
              />
            </ButtonList>
            <Circles
              :selected="selected"
              :index="index"
              :states="[true, false]"
              @toggle="(state) => emit('toggle-select', index, state)"
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

// reactive
const path = ref(props.path)

const groupedFiles = computed(() => {
  const groups = {}
  props.files.forEach((file, index) => {
    const { folder } = getParts(file.path)
    if (!groups[folder]) groups[folder] = { folder, files: [] }
    groups[folder].files.push({ file, index })
  })
  return Object.values(groups)
})

defineExpose({ focusPath: () => focusPath(pathEl) })

////////////////////////////////////////////////////////////////////////////////
const dEmitUpdatePath = debounce(() => emit("update-path", path.value), 1000)

function getTokensTotal() {
  return props.files.reduce((acc, file, i) => {
    if (props.selected[i]) acc += getTokens(file.content)
    return acc
  }, 0)
}
function focusPath(pathEl) {
  pathEl.value.focus()
  pathEl.value.setSelectionRange(0, pathEl.value.value.length)
}
function getParts(path) {
  const parts = path.split("\\")
  const file = parts.pop()
  let folder = parts.join("\\")
  if (folder) folder += `\\`
  return { folder, file }
}
</script>
