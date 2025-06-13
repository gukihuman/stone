// ~/components/Circle.vue
<template>
  <div
    class="bg-coffee-650 bg-circles-gradient p-2 rounded-xl h-full overflow-y-auto scroll-paper"
  >
    <ul v-if="displayEntities && displayEntities.length > 0" class="space-y-2">
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
    <p v-else-if="pending" class="text-coffee-400 italic">Loading circle...</p>
    <p v-if="error" class="text-red-400 mt-2">
      An error occurred fetching the circle.
    </p>
  </div>
</template>

<script setup>
const myEntity = ref({ name: null, nature: "bio" })
const circleEntities = ref([])
const selectedSpace = ref([])

const { pending, error } = await useAsyncData(
  "circle-data",
  async () => {
    const [meResponse, circleResponse] = await Promise.all([
      dbGetMyName(),
      dbGetCircle(),
    ])

    if (meResponse && meResponse.success) {
      myEntity.value.name = meResponse.name
      selectedSpace.value = [meResponse.name] // Initialize space with self
    }

    if (circleResponse && circleResponse.success) {
      circleEntities.value = circleResponse.circle
    }

    return { me: meResponse, circle: circleResponse }
  },
  { server: false }
)

const displayEntities = computed(() => {
  if (!myEntity.value.name) return []
  return [myEntity.value, ...circleEntities.value]
})

function isEntityActive(entityName) {
  return selectedSpace.value.includes(entityName)
}

function toggleEntityInSpace(entityName) {
  if (entityName !== "guki" && entityName === myEntity.value.name) return

  const index = selectedSpace.value.indexOf(entityName)
  if (index > -1) {
    selectedSpace.value.splice(index, 1)
  } else {
    selectedSpace.value.push(entityName)
  }
  console.log("Current Space:", selectedSpace.value)
}
</script>
