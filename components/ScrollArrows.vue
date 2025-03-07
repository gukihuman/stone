<template>
  <div class="flex flex-col absolute bottom-4 right-6">
    <div
      @click="onScrollTop"
      class="group pb-[3px] p-1"
      :class="[
        !disabledAfterClickTop && scrollTop > 1
          ? 'cursor-pointer opacity-60'
          : 'opacity-25',
      ]"
    >
      <button
        class="size-8 pb-1 rounded-full bg-stone-500 text-stone-400 cursor-default"
        :class="{
          'group-hover:text-stone-300 group-hover:bg-stone-800 cursor-pointer':
            theme === 'light' && !disabledAfterClickTop && scrollTop > 1,
          'group-hover:text-stone-200 group-hover:bg-stone-800 cursor-pointer':
            theme === 'dark' && !disabledAfterClickTop && scrollTop > 1,
        }"
      >
        <IconArrow class="w-3 -rotate-90 inline-block" />
      </button>
    </div>
    <div
      @click="onScrollBot"
      class="group pt-[3px] p-1"
      :class="[
        !disabledAfterClickBot && scrollTop + clientHeight <= scrollHeight - 1
          ? 'cursor-pointer opacity-60'
          : 'opacity-25',
      ]"
    >
      <button
        class="size-8 pb-1 rounded-full bg-stone-500 text-stone-400 cursor-default"
        :class="{
          'group-hover:text-stone-300 group-hover:bg-stone-800 cursor-pointer':
            theme === 'light' &&
            !disabledAfterClickBot &&
            scrollTop + clientHeight <= scrollHeight - 1,
          'group-hover:text-stone-200 group-hover:bg-stone-800 cursor-pointer':
            theme === 'dark' &&
            !disabledAfterClickBot &&
            scrollTop + clientHeight <= scrollHeight - 1,
        }"
      >
        <IconArrow class="w-3 rotate-90 inline-block" />
      </button>
    </div>
  </div>
</template>
<script setup>
const DISABLED_AFTER_CLICK_DELAY = 1000

const props = defineProps([
  "targetRef",
  "isAnyInputFocused",
  "theme",
  "scrollTop",
  "scrollHeight",
  "clientHeight",
])

const disabledAfterClickTop = ref(false)
const disabledAfterClickBot = ref(false)

onMounted(() => {
  window.scroll = () => {
    console.log(props.scrollTop)
  }
  addEventListener("keydown", onKeyDown)
})
onUnmounted(() => removeEventListener("keydown", onKeyDown))

function onScrollTop() {
  scrollToTop(props.targetRef)
  disabledAfterClickTop.value = true
  setTimeout(
    () => (disabledAfterClickTop.value = false),
    DISABLED_AFTER_CLICK_DELAY
  )
}
function onScrollBot() {
  scrollToBot(props.targetRef)
  disabledAfterClickBot.value = true
  setTimeout(
    () => (disabledAfterClickBot.value = false),
    DISABLED_AFTER_CLICK_DELAY
  )
}
function onKeyDown(event) {
  if (document.activeElement !== props.targetRef && !props.isAnyInputFocused) {
    if (event.key === "i") onScrollTop()
    else if (event.key === "g") onScrollBot()
  }
}
</script>
