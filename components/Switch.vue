<template>
  <div class="flex">
    <button
      v-for="(state, index) in states"
      :key="state"
      @click="handleClick(state)"
      class="flex justify-between min-w-[120px]"
      :class="[
        state === modelValue
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
const props = defineProps(["modelValue", "states"])
const emit = defineEmits(["update:modelValue", "change"])

// const states = computed(() => Object.entries(props.states))
function handleClick(state) {
  if (state !== props.modelValue) {
    emit("update:modelValue", state)
    emit("change")
  }
}
</script>
