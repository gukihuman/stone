// pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[1280px] flex h-screen p-1 gap-2">
      <!-- ## left menu -->
      <Circle
        class="w-[220px]"
        :myEntity="myEntity"
        :circleEntities="circleEntities"
        :selectedSpace="selectedSpace"
        :pending="pending"
        @toggle-entity="toggleEntityInSpace"
      />
      <!-- ## mid screen -->
      <div class="flex-grow h-full flex flex-col gap-2">
        <Draft
          ref="draftRef"
          @lock-hotkeys="hotkeysLockedByInput = true"
          @unlock-hotkeys="hotkeysLockedByInput = false"
        />
        <!-- # screen -->
        <div class="flex-grow p-2 rounded-xl bg-moss-350 overflow-hidden">
          <div class="overflow-hidden h-full">
            <div class="overflow-hidden rounded-lg h-full">
              <div
                class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
              >
                <!-- fragment display will go here -->
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- ## right menu -->
      <div class="w-[220px]">
        <Fragments :fragments="fragments" />
      </div>
    </div>
  </div>
</template>

<script setup>
const LOCAL_STORAGE_KEY = "stone-selected-space"
const { hotkeysLockedByInput, setupHotkeys } = useHotkeys()

const myEntity = ref({ name: null, nature: "bio" })
const circleEntities = ref([])
const selectedSpace = ref([])
const pending = ref(true)
const fragments = ref([])

const draftRef = ref(null)

// Hotkeys
let cleanupHotkeys
const hotkeys = {
  e: () => draftRef.value?.focus(),
}

onMounted(async () => {
  cleanupHotkeys = setupHotkeys(hotkeys)

  // Fetch circle data
  const [meResponse, circleResponse] = await Promise.all([
    dbGetMyName(),
    dbGetCircle(),
  ])

  if (meResponse?.success) myEntity.value.name = meResponse.name
  if (circleResponse?.success) circleEntities.value = circleResponse.circle

  // Initialize space from localStorage after fetching data
  const savedSpaceJSON = localStorage.getItem(LOCAL_STORAGE_KEY)
  const allKnownNames = [
    myEntity.value.name,
    ...circleEntities.value.map((e) => e.name),
  ].filter(Boolean)

  let finalSpace = [myEntity.value.name] // Always include self

  if (savedSpaceJSON) {
    try {
      const savedNames = JSON.parse(savedSpaceJSON)
      if (Array.isArray(savedNames)) {
        savedNames.forEach((name) => {
          // Add saved name only if it exists in the current circle and isn't the user themself
          if (name !== myEntity.value.name && allKnownNames.includes(name)) {
            finalSpace.push(name)
          }
        })
      }
    } catch (e) {
      console.error("error parsing selected space from local storage", e)
    }
  }

  selectedSpace.value = [...new Set(finalSpace)] // Ensure uniqueness
  pending.value = false

  fetchFragments()
})

onUnmounted(() => {
  if (cleanupHotkeys) cleanupHotkeys()
})

watch(
  selectedSpace,
  (newSpace) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSpace))
    fetchFragments()
  },
  { deep: true }
)

function toggleEntityInSpace(entityName) {
  // Logic to toggle entity in selectedSpace, handled by the parent
  const index = selectedSpace.value.indexOf(entityName)
  if (index > -1) {
    if (entityName !== "guki" && entityName === myEntity.value.name) return
    selectedSpace.value.splice(index, 1)
  } else {
    selectedSpace.value.push(entityName)
  }
}
async function fetchFragments() {
  if (selectedSpace.value.length === 0) {
    fragments.value = []
    return
  }
  const { success, fragments: fetchedFragments } = await dbGetFragments({
    space: selectedSpace.value,
  })
  if (success) {
    fragments.value = fetchedFragments
  } else {
    fragments.value = []
    console.error("failed to fetch fragments")
  }
}
</script>
