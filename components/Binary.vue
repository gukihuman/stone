<template>
  <div class="flex gap-1 justify-end">
    <div
      v-for="(group, i) in groups"
      :key="i"
      class="h-5 text-xl flex items-center justify-end tracking-[-0.25rem]"
      :class="{
        'text-stone-300': theme === 'light',
        'text-stone-400/60': theme === 'dark',
      }"
    >
      {{ group }}
    </div>
  </div>
</template>
<script setup>
defineProps(["groups", "theme"])
</script>
<!-- :class="i === groups.length - 1 ? 'text-stone-400' : 'text-stone-300'" -->
