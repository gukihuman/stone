<!-- pages/test.vue -->
<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-[720px] h-full flex flex-col justify-between bg-stone-500 rounded-lg shadow-lg bg-circles-gradient"
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
          <Button600
            @click="onRemoveEntity"
            :active="loading.removeEntity"
            :disabled="isAnythingLoading && !loading.removeEntity"
          >
            remove-entity
          </Button600>
          <Button600
            @click="onCreateFragment"
            :active="loading.createFragment"
            :disabled="isAnythingLoading && !loading.createFragment"
          >
            create-fragment
          </Button600>
          <Button600
            @click="onGetFragments"
            :active="loading.getFragments"
            :disabled="isAnythingLoading && !loading.getFragments"
          >
            get-fragments
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
            class="w-full h-[400px] bg-stone-600 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-light bg-screen cursor-text selection-light text-lg"
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
  removeEntity: false,
  createFragment: false,
  getFragments: false,
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
  const entityName = window.prompt("name")
  if (!entityName) return
  const entityNature = window.prompt("nature (bio or digi)")
  if (!entityNature) return
  await frameAction("createEntity", async () => {
    const entityData = { name: entityName, nature: entityNature }
    const { success, entity, ...rest } = await dbCreateEntity(entityData)
    screen.value = JSON.stringify(success ? entity : rest, null, 2)
  })
}
async function onGetEntities() {
  const stoneId = localStorage.getItem("stone-id")
  if (!stoneId) {
    screen.value = "stone-id not in local storage"
    return
  }
  await frameAction("getEntities", async () => {
    const { success, entities, ...rest } = await dbGetEntities(stoneId)
    screen.value = JSON.stringify(success ? entities : rest, null, 2)
  })
}
async function onRemoveEntity() {
  const entityId = window.prompt("❗ entity id to remove")
  if (!entityId) return
  frameAction("removeEntity", async () => {
    const { message } = await dbRemoveEntity(entityId)
    screen.value = message
  })
}
async function onCreateFragment() {
  const entity = window.prompt("creator")
  if (!entity) return
  const spaceInput = window.prompt("space (comma-separated guki,roxanne)")
  if (!spaceInput) return
  const space = spaceInput.split(",").map((s) => s.trim())
  const data = window.prompt("data")
  if (typeof data !== "string") return
  const parent = window.prompt("parent (optional, enter to skip)") || null
  frameAction("createFragment", async () => {
    const fragmentData = { entity, space, data, parent }
    const result = await dbCreateFragment(fragmentData)
    screen.value = JSON.stringify(result, null, 2)
  })
}
async function onGetFragments() {
  const spaceInput = window.prompt("space eg. g,r (optional, enter to skip)")
  if (spaceInput) filters.space = spaceInput.split(",").map((s) => s.trim())

  const kindInput = window.prompt("kind (optional, enter to skip)")
  if (kindInput) filters.kind = kindInput

  const tokensInput = window.prompt("tokens (optional, enter to skip)")
  if (tokensInput) {
    const parsedTokens = parseInt(tokensInput, 10)
    if (!isNaN(parsedTokens)) filters.tokens = parsedTokens
  }
  const entityInput = window.prompt("entity (optional, enter to skip)")
  if (entityInput) filters.entity = entityInput

  const parentInput = window.prompt("parent (optional, enter to skip)")
  if (parentInput) filters.parent = parentInput

  frameAction("getFragments", async () => {
    const result = await dbGetFragments(filters)
    screen.value = JSON.stringify(result, null, 2)
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

<style>
@keyframes screen‑scroll {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 0 400px;
  }
}
.bg-screen {
  background-image: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      rgba(255, 255, 255, 0.02) 400px
    ),
    radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.05) 2px, transparent 1px);
  background-size: 100% 400px, 5px 5px;
  animation: screen‑scroll 10s linear infinite;
}
</style>
