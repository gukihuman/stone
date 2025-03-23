<template>
  <div class="flex pr-[2px] flex-shrink-0">
    <div
      v-for="state in states"
      class="flex-shrink-0 px-[2px] flex items-center justify-center cursor-pointer"
      @click="emit('toggle', state)"
    >
      <div
        class="flex items-center justify-center rounded-full size-5 bg-stone-550"
      >
        <div
          class="rounded-full size-3"
          :class="
            index !== undefined
              ? {
                  'bg-stone-300':
                    (state === true && focused) ||
                    (state === true && selected[index] === true) ||
                    (state === 0 && selected[index] === 0),
                  'bg-stone-400': state === 1 && selected[index] === 1,
                  'bg-stone-500':
                    !focused &&
                    ((state === false && selected[index] === false) ||
                      (state === null && selected[index] === null)),
                }
              : {
                  'bg-stone-300':
                    (state === true && selected.every((is) => is === true)) ||
                    (state === 0 && selected.every((is) => is === 0)),
                  'bg-stone-400':
                    state === 1 && selected.every((is) => is === 1),
                  'bg-stone-500':
                    (state === false && selected.every((is) => is === false)) ||
                    (state === null && selected.every((is) => is === null)),
                }
          "
        />
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps(["selected", "states", "index", "focused"])
const emit = defineEmits(["toggle"])
</script>
