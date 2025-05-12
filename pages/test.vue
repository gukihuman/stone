<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-full h-full flex flex-col justify-between max-w-2xl bg-stone-500 rounded-lg shadow-lg bg-circles"
    >
      <!-- # controls -->
      <div class="flex flex-col">
        <div
          class="flex flex-wrap gap-2 p-3 border-b-[3px] border-stone-450 border-dashed items-end"
        >
          <p class="font-pacifico text-stone-350 text-2xl pl-1">api /</p>
          <Button600
            @click="onGen"
            :active="isGenTestLoading"
            :disabled="isAnythingLoading && !isGenTestLoading"
          >
            gen
          </Button600>
          <Button600
            @click="onStreamDurationTest"
            :active="isStreamTestRunning"
            :disabled="isAnythingLoading && !isStreamTestRunning"
          >
            stream-duration-test
          </Button600>
        </div>
        <div class="flex flex-wrap gap-2 p-3 flex-grow items-end">
          <p class="font-pacifico text-stone-350 text-2xl pl-1">api-node /</p>
          <Button600
            @click="onGetUsageOpenAI"
            :active="isGetUsageLoading"
            :disabled="isAnythingLoading && !isGetUsageLoading"
          >
            get-usage-openai
          </Button600>
        </div>
      </div>
      <!-- # console output area -->
      <div class="p-3">
        <div class="relative overflow-hidden rounded-lg shadow-lg">
          <Button600
            @click="onCopyScreen"
            :active="isCopyingScreen"
            :disabled="
              !screenContent || (isAnythingLoading && !isCopyingScreen)
            "
            class="absolute right-6 top-2"
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

const isCopyingScreen = ref(false)
const isGenTestLoading = ref(false)
const isStreamTestRunning = ref(false)
const isGetUsageLoading = ref(false)

const isAnythingLoading = computed(() => {
  return (
    isGetUsageLoading.value ||
    isStreamTestRunning.value ||
    isCopyingScreen.value ||
    isGenTestLoading.value
  )
})
onMounted(() => (cleanupHotkeys = setupHotkeys(hotkeys)))
onUnmounted(() => (cleanupHotkeys ? cleanupHotkeys() : {}))

////////////////////////////////////////////////////////////////////////////////
async function onCopyScreen() {
  if (!screenContent.value || isCopyingScreen.value) return
  await clipboard({
    input: screenContent.value,
    locked: isCopyingScreen,
  })
}
async function onGen() {
  isGenTestLoading.value = true
  screenContent.value = ""
  try {
    await gen({
      provider: "openai",
      model: "gpt-4.5-preview",
      input: "tell a very short story about a puppy girl",
      onChunk: (chunk) => (screenContent.value += chunk),
      onError: (err) => {
        console.error("Gen test stream error:", err)
        screenContent.value = `gen error ${
          err.message || "unknown streaming error"
        }`
      },
    })
  } catch (setupError) {
    console.error("error setting up gen test:", setupError)
    screenContent.value = `gen setup error ${
      setupError.message || "failed to start generation"
    }`
  } finally {
    isGenTestLoading.value = false
  }
}
async function onStreamDurationTest() {
  isStreamTestRunning.value = true
  screenContent.value = "stream duration test starts..."
  try {
    await streamDurationTest((chunk) => (screenContent.value += chunk))
  } catch (err) {
    screenContent.value = err.message || "stream error"
  } finally {
    isStreamTestRunning.value = false
  }
}
async function onGetUsageOpenAI() {
  isGetUsageLoading.value = true
  screenContent.value = ""
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
</script>
