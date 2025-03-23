<template>
  <div class="flex gap-1 text-stone-400 justify-end items-center">
    <!-- <p class="cursor-default">{{ field }}</p> -->
    <ButtonLightSmall
      @click="emit('copy', field)"
      :disabled="isLocked.copy[field]"
    >
      copy
    </ButtonLightSmall>
    <ButtonLightSmall
      @click="emit('gen', field)"
      :disabled="isLocked.gen[field]"
    >
      gen
    </ButtonLightSmall>
  </div>
</template>
<script setup>
defineProps(["field", "isLocked"])
const emit = defineEmits(["copy", "gen"])
</script>
