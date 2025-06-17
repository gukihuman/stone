// components/Circle.vue
<template>
  <div
    class="bg-coffee-650 bg-circles-gradient p-2 rounded-xl h-full overflow-y-auto scroll-paper"
  >
    <ul v-if="!pending && myEntity" class="space-y-2">
      <li v-for="entity in displayEntities" :key="entity.name">
        <Button
          class="w-full"
          :active="isEntityActive(entity.name)"
          :disabled="myEntity.name !== 'guki' && entity.name !== myEntity.name"
          @click="emit('toggle-entity', entity.name)"
        >
          <div class="flex items-center gap-2 w-full px-3">
            <IconStar v-if="entity.nature === 'digi'" class="size-5" />
            <IconDna v-else class="size-5" />
            <span class="font-semibold text-lg pb-1">{{ entity.name }}</span>
          </div>
        </Button>
      </li>
    </ul>
    <p v-else class="text-coffee-300 italic text-lg w-full text-center mt-2">
      loading circle...
    </p>
  </div>
</template>

<script setup>
const props = defineProps([
  "myEntity",
  "circleEntities",
  "selectedSpace",
  "pending",
])

const emit = defineEmits(["toggle-entity"])

const displayEntities = computed(() => {
  if (!props.myEntity) return []
  return [props.myEntity, ...props.circleEntities]
})

function isEntityActive(entityName) {
  return props.selectedSpace.includes(entityName)
}
</script>
