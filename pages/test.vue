<!-- pages/test.vue -->
<template>
  <div class="p-2 h-screen flex justify-center">
    <div
      class="w-[720px] h-full flex flex-col bg-coffee-700 justify-between rounded-xl shadow-md bg-circles-gradient"
    >
      <!-- # buttons -->
      <div class="flex flex-col gap-3 p-3">
        <!-- # api -->
        <div class="flex flex-wrap gap-2 items-end">
          <p class="font-pacifico text-coffee-200 text-2xl pl-1">api /</p>
          <Button
            @click="wrapFn(onStreamDurationTest)"
            :active="loading.onStreamDurationTest"
            :disabled="isAnythingLoading && !loading.onStreamDurationTest"
            lock-active
          >
            stream-duration-test
          </Button>
          <Button
            v-for="(option, key) in GEN_OPTIONS"
            :key="key"
            @click="wrapFn(() => onGen(option.provider, option.model), key)"
            :active="loading[key]"
            :disabled="isAnythingLoading && !loading[key]"
            lock-active
          >
            {{ key }}
          </Button>
        </div>
        <!-- # api-node -->
        <div class="flex flex-wrap gap-2 flex-grow items-end">
          <p class="font-pacifico text-coffee-200 text-2xl pl-1">api-node /</p>
          <Button
            v-for="(fn, name) in API_NODE"
            :key="name"
            @click="wrapFn(fn)"
            :active="loading[name]"
            :disabled="isAnythingLoading && !loading[name]"
            lock-active
          >
            {{ toKebab(name).replace(/^on-/, "") }}
          </Button>
        </div>
        <!-- # rest -->
        <div class="flex gap-2 pt-3">
          <Button
            @click="onCopyResponse"
            :active="isCopyResponseLoading"
            :disabled="!responseScreen"
            lock-active
          >
            copy response
          </Button>
          <Button
            @click="onChangeStoneId"
            :active="loading.onChangeStoneId"
            :disabled="isAnythingLoading && !loading.onChangeStoneId"
            lock-active
          >
            change stone id
          </Button>
        </div>
      </div>
      <!-- # screen -->
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
                <div class="w-[200px]">{{ cookieStoneId }}</div>
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
const { setupHotkeys } = useHotkeys()
let cleanupHotkeys
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
const API_NODE = {
  onGetUsageOpenai,
  onValidateStoneId,
  onCreateEntity,
  onGetEntities,
  onRemoveEntity,
  onCreateFragment,
  onGetFragments,
  onRemoveFragment,
  onGetMyName,
  onDbGetCircle,
  onDbAddCircleEntity,
  onDbRemoveCircleEntity,
}
const loading = reactive({})
const isAnythingLoading = computed(() => Object.values(loading).some((k) => k))
const isCopyResponseLoading = ref(false)
const cookieStoneId = useCookie("stone-id")
const entityNameScreen = ref("")
const responseScreen = ref("")
onMounted(() => {
  cleanupHotkeys = setupHotkeys(hotkeys)
  updateMyName()
})
onUnmounted(cleanupHotkeys)

//////////////////////////////////// api ///////////////////////////////////////
async function onStreamDurationTest() {
  await streamDurationTest((chunk) => (responseScreen.value += chunk))
}
async function onGen(provider, model) {
  await gen({
    provider,
    model,
    input: "tell a very short story about a puppy girl",
    onChunk: (chunk) => (responseScreen.value += chunk),
    onError: (err) => (responseScreen.value = err.message || "unknown error"),
  })
}
////////////////////////////////// api-node ////////////////////////////////////
async function onGetUsageOpenai() {
  const usage = await getUsageOpenai()
  if (usage !== null) responseScreen.value = JSON.stringify(usage, null, 2)
  else responseScreen.value = "getUsageOpenAI responded with null"
}
async function onValidateStoneId() {
  const stoneId = prompt("stone-id to validate")
  const { success } = await validateStoneId(stoneId)
  responseScreen.value = success ? "validated" : "not validated"
}
async function onCreateEntity() {
  const entityId = window.prompt("id (optional, automatic newId)")
  const entityName = window.prompt("name")
  if (!entityName) return
  const entityNature = window.prompt("nature (bio or digi)")
  if (!entityNature) return
  const entityData = { _id: entityId, name: entityName, nature: entityNature }
  const { success, entity, ...rest } = await dbCreateEntity(entityData)
  responseScreen.value = JSON.stringify(success ? entity : rest, null, 2)
}
async function onGetEntities() {
  const { success, entities, ...rest } = await dbGetEntities()
  responseScreen.value = JSON.stringify(success ? entities : rest, null, 2)
}
async function onRemoveEntity() {
  const entityId = window.prompt("❗ entity id to remove")
  if (!entityId) return
  const { message } = await dbRemoveEntity(entityId)
  responseScreen.value = message
}
async function onCreateFragment() {
  const entity = window.prompt("creator")
  if (!entity) return
  const spaceInput = window.prompt("space (comma-separated guki,roxanne)")
  if (!spaceInput) return
  const space = spaceInput.split(",").map((s) => s.trim())
  const data = window.prompt("data")
  if (typeof data !== "string") return
  const parent = window.prompt("parent (optional)") || null
  const fragmentData = { entity, space, data, parent }
  const result = await dbCreateFragment(fragmentData)
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onGetFragments() {
  const filters = {}
  const spaceInput = window.prompt("space eg. g,r (optional)")
  if (spaceInput) filters.space = spaceInput.split(",").map((s) => s.trim())

  const kindInput = window.prompt("kind (optional)")
  if (kindInput) filters.kind = kindInput

  const tokensInput = window.prompt("tokens (optional)")
  if (tokensInput) {
    const parsedTokens = parseInt(tokensInput, 10)
    if (!isNaN(parsedTokens)) filters.tokens = parsedTokens
  }
  const entityInput = window.prompt("entity (optional)")
  if (entityInput) filters.entity = entityInput

  const parentInput = window.prompt("parent (optional)")
  if (parentInput) filters.parent = parentInput

  const result = await dbGetFragments(filters)
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onRemoveFragment() {
  const fragmentId = window.prompt("fragment id to remove")
  if (!fragmentId) return
  const result = await dbRemoveFragment(fragmentId)
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onGetMyName() {
  const result = await dbGetMyName()
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onDbGetCircle() {
  const result = await dbGetCircle()
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onDbAddCircleEntity() {
  const entityName = window.prompt("entity name to add to circle")
  if (!entityName) return
  const result = await dbAddCircleEntity(entityName)
  responseScreen.value = JSON.stringify(result, null, 2)
}
async function onDbRemoveCircleEntity() {
  const entityName = window.prompt("entity name to remove from circle")
  if (!entityName) return
  const result = await dbRemoveCircleEntity(entityName)
  responseScreen.value = JSON.stringify(result, null, 2)
}
//////////////////////////////////// rest //////////////////////////////////////
async function onCopyResponse() {
  await clipboard({
    input: responseScreen.value,
    locked: isCopyResponseLoading,
  })
}
async function onChangeStoneId() {
  const newStoneId = window.prompt("new stone id")
  if (!newStoneId) return
  // next tick because of cookie value reactivity
  cookieStoneId.value = newStoneId
  entityNameScreen.value = ""
  nextTick(() => wrapFn(updateMyName, "onChangeStoneId"))
}
////////////////////////////////// helpers /////////////////////////////////////
async function updateMyName() {
  const { success, name } = await dbGetMyName()
  if (success) entityNameScreen.value = name
}
async function wrapFn(fn, key) {
  responseScreen.value = ""
  loading[key || fn.name] = true
  await fn()
  loading[key || fn.name] = false
}
</script>
