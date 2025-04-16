<template>
  <div
    class="flex items-center justify-center h-screen bg-stone-800 text-stone-300"
  >
    <div v-if="!participant">
      <input type="text" v-model="enteredId" :disabled="isLoading" />
      <button @click="handleJoin" :disabled="isLoading">
        {{ isLoading ? "Joining..." : "Join Circle" }}
      </button>
      <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
    </div>

    <div v-else>
      <h2>Welcome, {{ participant.name || participant._id }}!</h2>
      <p>(Chat interface will go here)</p>
    </div>
  </div>
</template>

<script setup>
const enteredId = ref("")
const participant = ref(null) // Stores { _id, name, role } if valid
const isLoading = ref(false)
const errorMessage = ref("")

async function handleJoin() {
  isLoading.value = true
  errorMessage.value = ""
  participant.value = null

  const result = await apiValidateParticipant(enteredId.value)

  if (result?.success) {
    participant.value = result.participant
    console.log(`Welcome, ${participant.value.name || participant.value._id}!`)
    // --> Here you would hide the login form and show the chat UI
  } else {
    errorMessage.value = result?.message || "An unknown error occurred."
  }

  isLoading.value = false
}
</script>
