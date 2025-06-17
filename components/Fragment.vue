// components/Fragments.vue
<template>
  <div
    class="bg-coffee-650 bg-circles-gradient p-2 rounded-xl h-full overflow-y-auto scroll-paper"
  >
    <ul v-if="fragments && fragments.length > 0" class="space-y-3">
      <li v-for="fragment in fragments" :key="fragment.id">
        <div class="px-2 py-1 rounded-lg cursor-pointer hover:bg-coffee-700">
          <p class="font-semibold text-coffee-200 truncate">
            {{ fragment.entity }}
          </p>
          <p class="text-sm text-coffee-400 line-clamp-2">
            {{ fragment.data }}
          </p>
        </div>
      </li>
    </ul>
    <p v-else class="text-coffee-300 italic text-lg w-full text-center mt-2">
      no fragments in this space...
    </p>
  </div>
</template>

<script setup>
defineProps(["fragments"])
</script>
