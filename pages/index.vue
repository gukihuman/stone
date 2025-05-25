// pages/index.vue
<template>
  <div
    class="flex justify-center p-3 h-screen bg-coffee-600 bg-circles-gradient"
  >
    <div class="w-[720px] h-full flex flex-col gap-2">
      <!-- ## draft  -->
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
              class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-text selection-screen text-lg"
            >
              {{ screenContent }}
            </div>
          </div>
        </div>
      </div>
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

onMounted(() => (cleanupHotkeys = setupHotkeys(hotkeys)))
onUnmounted(() => cleanupHotkeys())
</script>
