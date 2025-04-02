<template>
  <div class="flex">
    <button
      v-for="(state, index) in states"
      :key="state"
      @click="handleClick(state)"
      class="flex justify-between min-w-[90px] w-full"
      :class="[
        theme === 'dark'
          ? state === modelValue
            ? 'cursor-default bg-stone-500 text-stone-200'
            : 'bg-stone-700  text-stone-400 hover:bg-stone-500 hover:text-stone-200'
          : state === modelValue
          ? 'cursor-default bg-stone-500 text-stone-200'
          : 'bg-stone-600  text-stone-400 hover:bg-stone-500 hover:text-stone-200',
        index === 0 ? 'rounded-l-lg' : '',
        index === states.length - 1 ? 'rounded-r-lg' : '',
      ]"
    >
      <span class="pb-1 mx-auto px-3">
        {{ state }}
      </span>
      <div
        v-if="index < states.length - 1"
        class="h-full bg-stone-600 border-dotted border-r-[3px] border-stone-500"
      />
    </button>
  </div>
</template>
<script setup>
const props = defineProps(["modelValue", "states", "theme"])
const emit = defineEmits(["update:modelValue", "change"])

////////////////////////////////////////////////////////////////////////////////
function handleClick(state) {
  if (state !== props.modelValue) {
    emit("update:modelValue", state)
    emit("change")
  }
}
</script>
