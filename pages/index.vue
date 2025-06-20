// ~/pages/index.vue
<template>
  <div class="flex justify-center">
    <div class="w-[1280px] flex h-screen p-1 gap-2">
      <!-- # column one -->
      <Circle
        class="w-[220px]"
        :myEntity="myEntity"
        :circleEntities="circleEntities"
        :selectedSpace="selectedSpace"
        :pending="pending"
        @toggle-entity="toggleEntityInSpace"
      />
      <!-- # column two -->
      <div class="flex-grow h-full flex flex-col gap-2">
        <!-- ## draft -->
        <Draft
          ref="draftRef"
          @lock-hotkeys="hotkeysLockedByInput = true"
          @unlock-hotkeys="hotkeysLockedByInput = false"
        />
        <!-- ## screen -->
        <div class="flex-grow p-2 rounded-xl bg-moss-350 overflow-hidden">
          <div class="overflow-hidden h-full">
            <div class="overflow-hidden rounded-lg h-full">
              <div
                class="w-full h-full bg-moss-400 text-stone-300 rounded-lg p-3 px-5 font-fira-code overflow-auto whitespace-pre-wrap scroll-screen bg-screen cursor-default selection-screen text-lg"
              >
                {{ screen }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- # column three -->
      <div class="w-[220px]">
        <!-- ## controls -->
        <div class="flex flex-col gap-2 p-1">
          <Button @click="onCreateFragment">Create Fragment</Button>
        </div>
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
const screen = ref("")
const creationModeActive = ref(false)

const draftRef = ref(null)

// Hotkeys
let cleanupHotkeys
const hotkeys = {
  e: () => draftRef.value?.focus(),
  h: () => {
    if (myEntity.value.name === "guki") {
      creationModeActive.value = true
      // You mentioned UI feedback, this is a simple way to do it
      console.log(creationModeActive.value)
      screen.value = "[ CREATION MODE ACTIVE ]"
      // but lets leave screen alone for now
    }
  },
  Escape: () => {
    if (creationModeActive.value) {
      creationModeActive.value = false
      console.log(creationModeActive.value)
      screen.value = ""
    }
  },
  r: () => onDigiHotkey("roxanne"),
  j: () => onDigiHotkey("jane"),
  e: () => onDigiHotkey("ember"),
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

  let finalSpace = myEntity.value.name !== "guki" ? [myEntity.value.name] : []

  if (savedSpaceJSON) {
    const savedNames = JSON.parse(savedSpaceJSON)
    savedNames.forEach((name) => {
      if (allKnownNames.includes(name)) finalSpace.push(name)
    })
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
async function onCreateFragment() {
  const draftContent = draftRef.value?.draft
  if (!draftContent) {
    console.error("draft is empty")
    return
  }
  const fragmentData = {
    entity: myEntity.value.name,
    space: selectedSpace.value,
    data: draftContent,
  }
  const { success } = await dbCreateFragment(fragmentData)
  if (success) {
    draftRef.value?.clearDraft()
    fetchFragments()
  } else {
    console.error("failed to create fragment")
  }
}
async function onDigiHotkey(entityName) {
  if (!selectedSpace.value.includes(entityName)) {
    console.error(`${entityName} is not in the current space`)
    return
  }

  if (creationModeActive.value) {
    // --- Creation Mode ---
    try {
      const clipboardContent = await navigator.clipboard.readText()
      if (!clipboardContent) {
        console.error("clipboard is empty")
        return
      }
      const fragmentData = {
        entity: entityName,
        space: selectedSpace.value,
        data: clipboardContent,
      }
      const { success } = await dbCreateFragment(fragmentData)
      if (success) {
        fetchFragments()
        // maybe a small success message on screen?
        screen.value = clipboardContent
      } else {
        console.error(`failed to create fragment for ${entityName}`)
      }
    } catch (error) {
      console.error("failed to read from clipboard", error)
    }
  } else {
    // --- Copy Context Mode (for now, just a placeholder) ---
    console.log(`TODO: copy context for ${entityName}`)
    // We would use our clipboard write utility here in the future
  }
}
</script>
