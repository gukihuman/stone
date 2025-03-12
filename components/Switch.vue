<template>
  <div class="flex">
    <button
      v-for="(field, index) in fields"
      :key="field"
      @click="handleClick(field)"
      class="flex justify-between min-w-[120px]"
      :class="[
        field === modelValue
          ? 'cursor-default bg-stone-500 text-stone-200'
          : 'bg-stone-600  text-stone-400 hover:bg-stone-500 hover:text-stone-200',
        index === 0 ? 'rounded-l-lg' : '',
        index === fields.length - 1 ? 'rounded-r-lg' : '',
      ]"
    >
      <span class="pb-1 mx-auto px-3">
        {{ field }}
      </span>
      <div
        v-if="index < fields.length - 1"
        class="h-full bg-stone-600 border-dotted border-r-[3px] border-stone-500"
      />
    </button>
  </div>
</template>
<script setup>
const props = defineProps(["modelValue", "fields"])
const emit = defineEmits(["update:modelValue", "change"])

// const fields = computed(() => Object.entries(props.fields))
function handleClick(field) {
  if (field !== props.modelValue) {
    emit("update:modelValue", field)
    emit("change")
  }
}
</script>
