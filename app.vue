<template>
  <div class="min-h-screen">
    <div
      v-if="!authorized"
      class="flex w-full justify-center h-screen items-center"
    >
      <div class="flex flex-col gap-5 items-center w-[250px]">
        <input
          ref="inputEl"
          type="text"
          v-model="enteredId"
          class="px-4 py-1 rounded-lg bg-coffee-400 text-coffee-800 focus:ring-[6px] focus:ring-coffee-800 w-full text-center font-semibold text-lg"
          @input="dOnInput"
        />
      </div>
    </div>
    <NuxtPage v-else />
  </div>
</template>
<script setup>
const authorized = ref(false)
const enteredId = ref("")
const inputEl = ref(null)

onMounted(() => {
  inputEl.value.focus()
  const storedStoneId = localStorage.getItem("stone-id")
  console.log(storedStoneId)
  if (storedStoneId) {
    enteredId.value = storedStoneId
    attemptAuthorize(storedStoneId)
  }
})
////////////////////////////////////////////////////////////////////////////////
const dOnInput = debounce(() => attemptAuthorize(enteredId.value))
async function attemptAuthorize(id) {
  const result = await validateStoneId(id)
  if (result && result.success) authorized.value = true
  else console.log(`❗ attempt authorization ${result.message}`)
}
</script>
