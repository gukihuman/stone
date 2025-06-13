// ~/pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[1280px] flex h-screen p-1 gap-2">
      <Circle class="w-[220px]" />
      <div class="flex-grow h-full flex flex-col gap-2">
        <Draft
          ref="draftRef"
          @lock-hotkeys="() => (hotkeysLockedByInput = true)"
          @unlock-hotkeys="() => (hotkeysLockedByInput = false)"
        />
        <!-- # screen  -->
        <div class="flex-grow p-2 rounded-xl bg-moss-350 overflow-hidden">
          <div class="overflow-hidden h-full">
            <div class="overflow-hidden rounded-lg h-full">
              <div
                class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
              >
                {{ screenContent }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-[220px]"></div>
    </div>
  </div>
</template>

<script setup>
const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()
let cleanupHotkeys
const draftRef = ref(null)
const screenContent = ref("")
const hotkeys = {
  e: () => draftRef.value?.focus(),
}
onMounted(() => {
  cleanupHotkeys = setupHotkeys(hotkeys)
})
onUnmounted(() => {
  cleanupHotkeys()
})
</script>
