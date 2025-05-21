<!-- pages/test.vue -->
<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-[720px] h-full flex flex-col justify-between bg-stone-500 rounded-lg shadow-lg bg-circles"
    >
      <!-- # controls -->
      <div class="flex flex-col">
        <div
          class="flex flex-wrap gap-2 p-3 border-b-[3px] border-stone-450 border-dashed items-end"
        >
          <p class="font-pacifico text-stone-350 text-2xl pl-1">api /</p>
          <Button600
            @click="onStreamDurationTest"
            :active="loading.streamDurationTest"
            :disabled="isAnythingLoading && !loading.streamDurationTest"
          >
            stream-duration-test
          </Button600>
          <Button600
            v-for="(option, key) in GEN_OPTIONS"
            :key="key"
            @click="onGen(key, option.provider, option.model)"
            :active="loading[key]"
            :disabled="isAnythingLoading && !loading[key]"
          >
            {{ key }}
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
          <Button600
            @click="onCreateEntity"
            :active="loading.createEntity"
            :disabled="isAnythingLoading && !loading.createEntity"
          >
            create-entity
          </Button600>
          <Button600
            @click="onGetEntities"
            :active="loading.getEntities"
            :disabled="isAnythingLoading && !loading.getEntities"
          >
            get-entities
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
            class="w-full h-[250px] bg-stone-600 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-light screen-lines selection-light text-lg"
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

const GEN_OPTIONS = {
  // 1m
  "openai-gpt-4.5": { provider: "openai", model: "gpt-4.5-preview" },
  "openai-gpt-4.1": { provider: "openai", model: "gpt-4.1" },
  // 10m
  "openai-gpt-4o-mini": { provider: "openai", model: "gpt-4o-mini" },
  "openai-gpt-4.1-mini": { provider: "openai", model: "gpt-4.1-mini" },
  "openai-o4-mini": { provider: "openai", model: "o4-mini" },

  "togetherai-llama-4-maverick": {
    provider: "togetherai",
    model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
  },
}
const loading = reactive({
  // turn every gen option key into { key: false }
  ...Object.fromEntries(Object.keys(GEN_OPTIONS).map((key) => [key, false])),
  streamDurationTest: false,
  getUsageOpenAI: false,
  createEntity: false,
  getEntities: false,
})
const isAnythingLoading = computed(() => {
  return Object.values(loading).some((state) => state)
})
const screen = ref("")
const isCopyScreen = ref(false)
onMounted(() => (cleanupHotkeys = setupHotkeys(hotkeys)))
onUnmounted(() => (cleanupHotkeys ? cleanupHotkeys() : {}))

////////////////////////////////////////////////////////////////////////////////
async function onCopyScreen() {
  await clipboard({ input: screen.value, locked: isCopyScreen })
}
async function onGen(key, provider, model) {
  frameAction(key, async () => {
    await gen({
      provider,
      model,
      input: "tell a very short story about a puppy girl",
      onChunk: (chunk) => (screen.value += chunk),
      onError: (err) => (screen.value = err.message || "unknown error"),
    })
  })
}
async function onStreamDurationTest() {
  frameAction("streamDurationTest", async () => {
    await streamDurationTest((chunk) => (screen.value += chunk))
  })
}
async function onGetUsageOpenAI() {
  frameAction("getUsageOpenAI", async () => {
    const usage = await getUsageOpenAI()
    if (usage !== null) screen.value = JSON.stringify(usage, null, 2)
    else screen.value = "getUsageOpenAI responded with null"
  })
}
async function onCreateEntity() {
  frameAction("createEntity", async () => {
    const entityData = {
      _id: newId(),
      name: "Test Entity Rox",
      nature: "digi",
    }
    const result = await dbCreateEntity(entityData)
    if (result && result.success) {
      screen.value = `Entity created successfully:\n${JSON.stringify(
        result.entity,
        null,
        2
      )}`
    } else {
      screen.value = `Failed to create entity:\n${JSON.stringify(
        result,
        null,
        2
      )}`
    }
  })
}
async function onGetEntities() {
  frameAction("getEntities", async () => {
    const stoneId = localStorage.getItem("stone-id")
    if (!stoneId) {
      screen.value = "Action cancelled: stoneId not provided."
      return
    }
    const result = await dbGetEntities(stoneId)
    if (result && result.success) {
      screen.value = `Entities fetched successfully:\n${JSON.stringify(
        result.entities,
        null,
        2
      )}`
    } else {
      screen.value = `Failed to fetch entities:\n${JSON.stringify(
        result,
        null,
        2
      )}`
    }
  })
}
////////////////////////////////// helpers /////////////////////////////////////
async function frameAction(key, action) {
  screen.value = ""
  loading[key] = true
  await action()
  loading[key] = false
}
</script>
