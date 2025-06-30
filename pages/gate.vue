// ~/pages/gate.vue
<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col gap-5 w-[220px]">
      <input
        ref="inputEl"
        class="py-1 rounded-lg bg-coffee-400 text-coffee-800 focus:ring-[6px] focus:ring-coffee-800 w-full text-center font-semibold text-lg selection-paper"
        v-model="input"
        maxlength="20"
        @input="dValidateAndSetToken"
      />
    </div>
  </div>
</template>

<script setup>
const input = ref("")
const inputEl = ref(null)

onMounted(() => inputEl.value?.focus())

const dValidateAndSetToken = debounce(async () => {
  if (!input.value) return

  const { success } = await validateAccessToken(input.value)
  if (!success) return

  const accessToken = useCookie("access-token", {
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    sameSite: "lax",
  })
  accessToken.value = input.value
  navigateTo("/")
}, 300)
</script>
