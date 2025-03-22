<template>
  <div class="flex gap-1 text-stone-400 justify-end">
    <!-- <p class="cursor-default">{{ field }}</p> -->
    <ButtonLight @click="emit('copy', field)" :disabled="isLocked.copy[field]">
      copy
    </ButtonLight>
    <ButtonLight @click="emit('gen', field)" :disabled="isLocked.gen[field]">
      gen
    </ButtonLight>
  </div>
</template>
<script setup>
defineProps(["field", "isLocked"])
const emit = defineEmits(["copy", "gen"])
</script>
