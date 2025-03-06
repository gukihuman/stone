<template>
  <div
    class="flex gap-[6px] pt-[1px] pr-[1px] h-[22px] justify-end overflow-hidden flex-shrink-0"
  >
    <div
      v-for="(group, i) in groups"
      :key="i"
      class="h-7 pb-[2px] flex items-center justify-end"
      :class="{
        'text-stone-300': theme === 'light',
        'text-stone-400/60': theme === 'dark',
        'text-[32px] tracking-[-9.5px]': i < groups.length - 4,
        'text-[28px] pt-[2px] tracking-[-8px]': i === groups.length - 4,
        'text-[24px] pt-[3px] tracking-[-6.5px]': i === groups.length - 3,
        'text-[20px] pt-[4px] tracking-[-5px]': i === groups.length - 2,
        'text-[16px] pt-[5px] tracking-[-3.5px]': i === groups.length - 1,
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
