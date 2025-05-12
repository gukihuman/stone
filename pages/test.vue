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
            :active="loading.gen"
            :disabled="isAnythingLoading && !loading.gen"
          >
            gen
          </Button600>
          <Button600
            @click="onStreamDurationTest"
            :active="loading.streamDurationTest"
            :disabled="isAnythingLoading && !loading.streamDurationTest"
          >
            stream-duration-test
          </Button600>
        </div>
        <div class="flex flex-wrap gap-2 p-3 flex-grow items-end">
          <p class="font-pacifico text-stone-350 text-2xl pl-1">api-node /</p>
          <Button600
            @click="onGetUsageOpenAI"
            :active="loading.getUsageOpenAI"
            :disabled="isAnythingLoading && !loading.getUsageOpenAI"
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
            :active="isCopyScreen"
            :disabled="!screen"
            class="absolute right-6 bottom-2"
          >
            copy screen
          </Button600>
          <div
            class="w-full h-[300px] bg-stone-600 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-light screen-lines selection-light"
          >
            {{ screen }}
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
const hotkeys = { m: onCopyScreen }

const screen = ref("")
const isCopyScreen = ref(false)
const loading = reactive({
  gen: false,
  streamDurationTest: false,
  getUsageOpenAI: false,
})
const isAnythingLoading = computed(() => {
  return Object.values(loading).some((state) => state)
})
onMounted(() => (cleanupHotkeys = setupHotkeys(hotkeys)))
onUnmounted(() => (cleanupHotkeys ? cleanupHotkeys() : {}))

////////////////////////////////////////////////////////////////////////////////
async function onCopyScreen() {
  await clipboard({ input: screen.value, locked: isCopyScreen })
}
async function onGen() {
  withLoading("gen", async () => {
    await gen({
      provider: "openai",
      model: "gpt-4.5-preview",
      input: "tell a very short story about a puppy girl",
      onChunk: (chunk) => (screen.value += chunk),
      onError: (err) => (screen.value = err.message || "unknown error"),
    })
  })
}
async function onStreamDurationTest() {
  withLoading("streamDurationTest", async () => {
    await streamDurationTest((chunk) => (screen.value += chunk))
  })
}
async function onGetUsageOpenAI() {
  withLoading("getUsageOpenAI", async () => {
    const usage = await getUsageOpenAI()
    if (usage !== null) screen.value = `openai tokens today ${usage}`
    else screen.value = "getUsageOpenAI responded with null"
  })
}
////////////////////////////////// helpers /////////////////////////////////////
async function withLoading(key, action) {
  screen.value = ""
  loading[key] = true
  await action()
  loading[key] = false
}
</script>
