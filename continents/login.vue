// ~/pages/login.vue
<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col gap-5 w-[220px]">
      <input
        ref="inputEl"
        class="py-1 rounded-lg bg-coffee-400 text-coffee-800 focus:ring-[6px] focus:ring-coffee-800 w-full text-center font-semibold text-lg selection-paper"
        type="text"
        v-model="input"
        maxlength="22"
        @input="dTry"
      />
    </div>
  </div>
</template>

<script setup>
const input = ref("")
const inputEl = ref(null)
onMounted(() => inputEl.value?.focus())
const dTry = debounce(async () => {
  if (!input.value) return

  const { success } = await validateStoneId(input.value)
  if (!success) return

  const stoneId = useCookie("stone-id", {
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: "lax",
  })
  stoneId.value = input.value
  navigateTo("/")
})
</script>
