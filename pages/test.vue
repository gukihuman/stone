// pages/test.vue
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
            class="px-3 pb-1"
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
            class="px-3 pb-1"
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
            class="px-3 pb-1"
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
            class="px-3 pb-1"
          >
            copy response (m)
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
                <div class="w-[200px]">access-token</div>
              </div>
              <div class="flex text-moss-100 h-[40px]">
                <div class="w-[200px]">{{ accessTokenCookie }}</div>
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
  "openai-gpt-4.5": { provider: "openai", model: "gpt-4.5-preview" },
  "openai-gpt-4.1": { provider: "openai", model: "gpt-4.1" },
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
  onValidateAccessToken,
}
const loading = reactive({})
const isAnythingLoading = computed(() => Object.values(loading).some((k) => k))
const isCopyResponseLoading = ref(false)
const accessTokenCookie = useCookie("access-token")
const responseScreen = ref("")

onMounted(() => {
  cleanupHotkeys = setupHotkeys(hotkeys)
})
onUnmounted(cleanupHotkeys)

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
async function onGetUsageOpenai() {
  const usage = await getUsageOpenai()
  if (usage !== null) responseScreen.value = JSON.stringify(usage, null, 2)
  else responseScreen.value = "getUsageOpenAI responded with null"
}
async function onValidateAccessToken() {
  const token = window.prompt("access token to validate")
  if (!token) return
  const { success } = await validateAccessToken(token)
  responseScreen.value = success ? "token is valid" : "token is invalid"
}
async function onCopyResponse() {
  await clipboard({
    input: responseScreen.value,
    locked: isCopyResponseLoading,
  })
}
async function wrapFn(fn, key) {
  responseScreen.value = ""
  loading[key || fn.name] = true
  await fn()
  loading[key || fn.name] = false
}
</script>
