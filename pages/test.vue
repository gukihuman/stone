<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-full h-full flex flex-col justify-between max-w-2xl bg-stone-500 rounded-lg shadow-lg bg-circles"
    >
      <!-- # controls -->
      <div class="flex flex-col">
        <div
          class="flex flex-wrap gap-2 p-3 border-b-[3px] border-stone-450 border-dashed"
        >
          <Button600
            @click="onStreamTest"
            :active="isStreamTestRunning"
            :disabled="isAnythingLoading && !isStreamTestRunning"
          >
            stream duration test
          </Button600>
        </div>
        <div class="flex flex-wrap gap-2 p-3 flex-grow">
          <Button600
            @click="onGetUsageOpenAI"
            :active="isGetUsageLoading"
            :disabled="isAnythingLoading && !isGetUsageLoading"
          >
            get usage openai
          </Button600>
        </div>
      </div>
      <!-- # console output area -->
      <div class="relative overflow-hidden rounded-lg p-3">
        <Button600
          @click="onCopyScreen"
          :active="isCopyingScreen"
          :disabled="!screenContent || (isAnythingLoading && !isCopyingScreen)"
          class="absolute right-5 top-5"
        >
          copy screen
        </Button600>
        <div
          class="w-full h-[300px] bg-stone-600 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-light screen-lines selection-light"
        >
          {{ screenContent }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// hotkeys
const { setupHotkeys } = useHotkeys()
let cleanupHotkeys // hold cleanup function
const hotkeys = {
  m: onCopyScreen,
}

const screenContent = ref("")

const isGetUsageLoading = ref(false)
const isStreamTestRunning = ref(false)
const isCopyingScreen = ref(false)

const isAnythingLoading = computed(() => {
  return (
    isGetUsageLoading.value ||
    isStreamTestRunning.value ||
    isCopyingScreen.value
  )
})
onMounted(() => (cleanupHotkeys = setupHotkeys(hotkeys)))
onUnmounted(() => (cleanupHotkeys ? cleanupHotkeys() : {}))

////////////////////////////////////////////////////////////////////////////////
async function onGetUsageOpenAI() {
  isGetUsageLoading.value = true
  screenContent.value = "getting usage data..."
  try {
    const usage = await getUsageOpenAI()
    if (usage !== null) screenContent.value = `openai tokens today ${usage}`
    else screenContent.value = "getUsageOpenAI responded with null"
  } catch (error) {
    screenContent.value = error.message || "unknown error during api call"
  } finally {
    isGetUsageLoading.value = false
  }
}
async function onStreamTest() {
  isStreamTestRunning.value = true
  screenContent.value = ""

  try {
    await streamDurationTest((chunk) => (screenContent.value += chunk))
  } catch (err) {
    screenContent.value = err.message || "stream error"
  } finally {
    isStreamTestRunning.value = false
  }
}
async function onCopyScreen() {
  if (!screenContent.value || isCopyingScreen.value) return
  await clipboard({
    input: screenContent.value,
    locked: isCopyingScreen,
  })
}
</script>
