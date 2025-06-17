// ~/components/Circle.vue
<template>
  <div
    class="bg-coffee-650 bg-circles-gradient p-2 rounded-xl h-full overflow-y-auto scroll-paper"
  >
    <ul v-if="!pending && displayEntities.length > 0" class="space-y-2">
      <li v-for="entity in displayEntities" :key="entity.name">
        <Button
          class="w-full"
          :active="isEntityActive(entity.name)"
          :disabled="myEntity.name !== 'guki' && entity.name !== myEntity.name"
          @click="toggleEntityInSpace(entity.name)"
        >
          <div class="flex items-center gap-2 w-full px-3">
            <IconStar v-if="entity.nature === 'digi'" class="size-5" />
            <IconDna v-else class="size-5" />
            <span class="font-semibold text-lg pb-1">{{ entity.name }}</span>
          </div>
        </Button>
      </li>
    </ul>
    <p
      v-else-if="pending"
      class="text-coffee-300 italic text-lg w-full text-center mt-2"
    >
      loading circle...
    </p>
  </div>
</template>

<script setup>
const LOCAL_STORAGE_KEY = "stone-selected-space"

const myEntity = ref({ name: null, nature: "bio" })
const circleEntities = ref([])
const selectedSpace = ref([])
const pending = ref(true)

onMounted(async () => {
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
})

// Persist selectedSpace to localStorage whenever it changes
watch(
  selectedSpace,
  (newSpace) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSpace))
  },
  { deep: true }
)

const displayEntities = computed(() => {
  if (!myEntity.value.name) return []
  return [myEntity.value, ...circleEntities.value]
})

////////////////////////////////////////////////////////////////////////////////
function isEntityActive(entityName) {
  return selectedSpace.value.includes(entityName)
}
function toggleEntityInSpace(entityName) {
  if (myEntity.value.name !== "guki" && entityName !== myEntity.value.name)
    return

  const index = selectedSpace.value.indexOf(entityName)
  if (index > -1) {
    if (entityName === myEntity.value.name) return // Prevent removing self
    selectedSpace.value.splice(index, 1)
  } else {
    selectedSpace.value.push(entityName)
  }
}
</script>
