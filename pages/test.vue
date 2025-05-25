<!-- pages/test.vue -->
<template>
  <div class="p-2 h-screen flex justify-center">
    <!-- # main panel -->
    <div
      class="w-[720px] h-full flex flex-col bg-coffee-700 justify-between rounded-xl shadow-md bg-circles-gradient"
    >
      <!-- ## controls -->
      <div class="flex flex-col gap-3 p-3">
        <div class="flex flex-wrap gap-2 items-end">
          <p class="font-pacifico text-coffee-200 text-2xl pl-1">api /</p>
          <Button800
            @click="onStreamDurationTest"
            :active="loading.streamDurationTest"
            :disabled="isAnythingLoading && !loading.streamDurationTest"
          >
            stream-duration-test
          </Button800>
          <Button800
            v-for="(option, key) in GEN_OPTIONS"
            :key="key"
            @click="onGen(key, option.provider, option.model)"
            :active="loading[key]"
            :disabled="isAnythingLoading && !loading[key]"
          >
            {{ key }}
          </Button800>
        </div>
        <div class="flex flex-wrap gap-2 flex-grow items-end">
          <p class="font-pacifico text-coffee-200 text-2xl pl-1">api-node /</p>
          <Button800
            @click="onGetUsageOpenAI"
            :active="loading.getUsageOpenAI"
            :disabled="isAnythingLoading && !loading.getUsageOpenAI"
          >
            get-usage-openai
          </Button800>
          <Button800
            @click="onCreateEntity"
            :active="loading.createEntity"
            :disabled="isAnythingLoading && !loading.createEntity"
          >
            create-entity
          </Button800>
          <Button800
            @click="onGetEntities"
            :active="loading.getEntities"
            :disabled="isAnythingLoading && !loading.getEntities"
          >
            get-entities
          </Button800>
          <Button800
            @click="onRemoveEntity"
            :active="loading.removeEntity"
            :disabled="isAnythingLoading && !loading.removeEntity"
          >
            remove-entity
          </Button800>
          <Button800
            @click="onCreateFragment"
            :active="loading.createFragment"
            :disabled="isAnythingLoading && !loading.createFragment"
          >
            create-fragment
          </Button800>
          <Button800
            @click="onGetFragments"
            :active="loading.getFragments"
            :disabled="isAnythingLoading && !loading.getFragments"
          >
            get-fragments
          </Button800>
          <Button800
            @click="onRemoveFragment"
            :active="loading.removeFragment"
            :disabled="isAnythingLoading && !loading.removeFragment"
          >
            remove-fragment
          </Button800>
        </div>
        <div class="flex gap-2 pt-2">
          <Button800
            @click="onCopyResponse"
            :active="isCopyScreen"
            :disabled="!responseScreen"
          >
            copy response
          </Button800>
          <Button800
            @click="onChangeEntity"
            :active="loading.changeEntity"
            :disabled="isAnythingLoading && !loading.changeEntity"
          >
            change entity
          </Button800>
        </div>
      </div>
      <!-- ## screen -->
      <div class="flex-grow p-2 rounded-b-xl bg-moss-350 overflow-hidden">
        <div class="overflow-hidden h-full">
          <div class="overflow-hidden rounded-lg h-full">
            <div
              class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
            >
              <div class="flex text-moss-300">
                <div class="w-[200px]">stone-id</div>
                <div>stone-name</div>
              </div>
              <div class="flex text-moss-100 h-[40px]">
                <div class="w-[200px]">{{ entityIdScreen }}</div>
                <div>{{ entityNameScreen }}</div>
              </div>
              <div class="flex text-moss-300">
                <div>response</div>
              </div>
              <div>
                {{ responseScreen }}
              </div>
            </div>
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
const hotkeys = { m: onCopyResponse }

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
  changeEntity: false,
  createFragment: false,
  getFragments: false,
  removeFragment: false,
})
const isAnythingLoading = computed(() => {
  return Object.values(loading).some((state) => state)
})
const isCopyScreen = ref(false)
const entityIdScreen = ref("")
const entityNameScreen = ref("")
const responseScreen = ref("")
onMounted(() => {
  cleanupHotkeys = setupHotkeys(hotkeys)
  updateEntityInfo(localStorage.getItem("stone-id"))
})
onUnmounted(() => (cleanupHotkeys ? cleanupHotkeys() : {}))

////////////////////////////////////////////////////////////////////////////////
async function onCopyResponse() {
  await clipboard({ input: responseScreen.value, locked: isCopyScreen })
}
async function onGen(key, provider, model) {
  frameAction(key, async () => {
    await gen({
      provider,
      model,
      input: "tell a very short story about a puppy girl",
      onChunk: (chunk) => (responseScreen.value += chunk),
      onError: (err) => (responseScreen.value = err.message || "unknown error"),
    })
  })
}
async function onStreamDurationTest() {
  frameAction("streamDurationTest", async () => {
    await streamDurationTest((chunk) => (responseScreen.value += chunk))
  })
}
async function onGetUsageOpenAI() {
  frameAction("getUsageOpenAI", async () => {
    const usage = await getUsageOpenAI()
    if (usage !== null) responseScreen.value = JSON.stringify(usage, null, 2)
    else responseScreen.value = "getUsageOpenAI responded with null"
  })
}
///////////////////////////////// entities /////////////////////////////////////
async function onCreateEntity() {
  const entityId = window.prompt("id (optional, enter to automatic newId)")
  const entityName = window.prompt("name")
  if (!entityName) return
  const entityNature = window.prompt("nature (bio or digi)")
  if (!entityNature) return
  await frameAction("createEntity", async () => {
    const entityData = { _id: entityId, name: entityName, nature: entityNature }
    const { success, entity, ...rest } = await dbCreateEntity(entityData)
    responseScreen.value = JSON.stringify(success ? entity : rest, null, 2)
  })
}
async function onGetEntities() {
  await frameAction("getEntities", async () => {
    const { success, entities, ...rest } = await dbGetEntities()
    responseScreen.value = JSON.stringify(success ? entities : rest, null, 2)
  })
}
async function onRemoveEntity() {
  const entityId = window.prompt("❗ entity id to remove")
  if (!entityId) return
  frameAction("removeEntity", async () => {
    const { message } = await dbRemoveEntity(entityId)
    responseScreen.value = message
  })
}
async function onChangeEntity() {
  const newEntityId = window.prompt("new entity id")
  if (!newEntityId) return
  entityIdScreen.value = ""
  entityNameScreen.value = ""
  frameAction("changeEntity", async () => await updateEntityInfo(newEntityId))
}
async function updateEntityInfo(stoneId) {
  localStorage.setItem("stone-id", localStorage.getItem("stone-root-id"))
  const { success, entities } = await dbGetEntities()
  if (stoneId && success) {
    entityIdScreen.value = stoneId
    const entity = entities.find((entity) => entity._id === stoneId)
    localStorage.setItem("stone-name", entity)
    entityNameScreen.value = entity.name
  }
  localStorage.setItem("stone-id", stoneId)
}
///////////////////////////////// fragments ////////////////////////////////////
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
    responseScreen.value = JSON.stringify(result, null, 2)
  })
}
async function onGetFragments() {
  const filters = {}
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
    responseScreen.value = JSON.stringify(result, null, 2)
  })
}
async function onRemoveFragment() {
  const fragmentId = window.prompt("fragment id to remove")
  if (!fragmentId) return
  frameAction("removeFragment", async () => {
    const result = await dbRemoveFragment(fragmentId)
    responseScreen.value = JSON.stringify(result, null, 2)
  })
}
////////////////////////////////// helpers /////////////////////////////////////
async function frameAction(key, action) {
  responseScreen.value = ""
  loading[key] = true
  await action()
  loading[key] = false
}
</script>
