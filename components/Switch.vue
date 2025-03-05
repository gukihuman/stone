<template>
  <div class="flex">
    <button
      v-for="([label, value], index) in labelEntries"
      :key="value"
      @click="handleClick(value)"
      class="min-w-24 px-2 pb-1"
      :class="[
        value === modelValue
          ? 'cursor-default bg-stone-800 text-stone-300'
          : 'bg-stone-700  text-stone-400 hover:bg-stone-800 hover:text-stone-300',
        index === 0 ? 'rounded-l-lg' : '',
        index === labelEntries.length - 1 ? 'rounded-r-lg' : '',
        index < labelEntries.length - 1
          ? 'border-dotted border-r-[3px] border-stone-500'
          : '',
      ]"
    >
      {{ label }}
    </button>
  </div>
</template>
<script setup>
const props = defineProps(["modelValue", "labels"])
const emit = defineEmits(["update:modelValue", "change"])

const labelEntries = computed(() => Object.entries(props.labels))
function handleClick(value) {
  if (value !== props.modelValue) {
    emit("update:modelValue", value)
    emit("change", value)
  }
}
</script>
