<template>
  <div class="flex h-6 pb-1 gap-1 pr-[1px] flex-shrink-0 justify-end">
    <div
      v-for="(group, i) in groups"
      :key="i"
      class="h-6 flex justify-end items-center font-semibold text-sm font-fira-code"
      :class="
        theme === 'light'
          ? [
              i === groups.length - 3 ? 'text-stone-200' : '',
              i === groups.length - 2 ? 'text-stone-300' : '',
              i === groups.length - 1 ? 'text-stone-400' : '',
            ]
          : [
              i === groups.length - 3 ? 'text-stone-200' : '',
              i === groups.length - 2 ? 'text-stone-300' : '',
              i === groups.length - 1 ? 'text-stone-400' : '',
            ]
      "
    >
      {{ group }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["number", "theme"])

const groups = computed(() => {
  if (props.number === 0) return [""]
  let numStr = props.number.toString()
  const groupsArray = []
  while (numStr.length > 0) {
    if (numStr.length <= 3) {
      groupsArray.unshift(numStr)
      break
    }
    groupsArray.unshift(numStr.slice(-3))
    numStr = numStr.slice(0, -3)
  }
  return groupsArray
})
</script>
