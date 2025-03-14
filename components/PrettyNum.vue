<template>
  <div class="flex gap-1 pr-[1px] flex-shrink-0">
    <div
      v-for="(group, i) in groups"
      :key="i"
      class="h-7 flex items-center"
      :class="{
        'text-lg pb-[2px] text-stone-400': i === groups.length - 3,
        'text-[17px] pb-[1px] text-stone-400': i === groups.length - 2,
        'text-stone-450': i === groups.length - 1,
      }"
    >
      {{ group }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["number"])

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
