<template>
  <div class="flex">
    <button
      v-for="([label, value], index) in labelEntries"
      :key="value"
      @click="handleClick(value)"
      class="flex justify-between min-w-20"
      :class="[
        value === modelValue
          ? 'cursor-default bg-stone-500 text-stone-200'
          : 'bg-stone-600  text-stone-400 hover:bg-stone-500 hover:text-stone-200',
        index === 0 ? 'rounded-l-lg' : '',
        index === labelEntries.length - 1 ? 'rounded-r-lg' : '',
      ]"
    >
      <span class="pb-1 mx-auto px-3">
        {{ label }}
      </span>
      <div
        v-if="index < labelEntries.length - 1"
        class="h-full bg-stone-600 border-dotted border-r-[3px] border-stone-500"
      />
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
