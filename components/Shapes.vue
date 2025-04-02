<!-- components/Shapes.vue -->
<template>
  <div class="flex flex-col flex-1 gap-3 overflow-y-auto">
    <div
      class="flex flex-col flex-grow flex-shrink-0 bg-circles bg-stone-500 rounded-lg max-h-full overflow-hidden"
    >
      <div class="overflow-y-scroll pb-2 flex-grow">
        <div class="flex flex-col">
          <div
            class="flex max-w-full gap-1"
            v-for="(shapeName, i) in Object.keys(shapes || {})"
            :key="`shape-${i}`"
          >
            <ButtonList
              :active="focusedIndex === i"
              @click="emit('toggle-focus', i)"
            >
              <span class="truncate">{{ shapeName }}</span>
            </ButtonList>
            <div class="w-[29px]" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["shapes", "focusedIndex"])

const emit = defineEmits(["toggle-focus"])
</script>
