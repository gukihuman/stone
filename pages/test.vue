<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-full h-full flex flex-col justify-between max-w-2xl bg-stone-500 rounded-lg shadow-lg p-3 bg-circles"
    >
      <!-- # controls -->
      <div class="flex flex-wrap gap-2">
        <Button600
          @click="onGetUsage"
          :active="isGetUsageLoading"
          :disabled="isAnythingLoading && !isGetUsageLoading"
        >
          getUsageOpenAI
        </Button600>
        <Button600
          @click="onStreamTest"
          :active="isStreamTestRunning"
          :disabled="isAnythingLoading && !isStreamTestRunning"
        >
          streamDurationTest
        </Button600>
      </div>
      <!-- # console output area -->
      <div class="overflow-hidden rounded-lg">
        <div
          class="w-full h-[300px] bg-stone-600 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-light screen-lines"
        >
          {{ screenContent }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const screenContent = ref("")
const isGetUsageLoading = ref(false)
const isStreamTestRunning = ref(false)

const isAnythingLoading = computed(() => {
  return isGetUsageLoading.value || isStreamTestRunning.value
})
////////////////////////////////////////////////////////////////////////////////
async function onGetUsage() {
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
</script>
