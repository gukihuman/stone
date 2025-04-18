<template>
  <div
    class="flex flex-col h-screen bg-stone-800 text-stone-300 p-4 items-center justify-center"
  >
    <!-- Validation Screen -->
    <div
      v-if="!participant"
      class="flex flex-col gap-2 items-center bg-stone-700 p-6 rounded-lg shadow-lg"
    >
      <h2 class="text-xl font-semibold mb-4">Enter Your Circle ID</h2>
      <input
        type="text"
        v-model="enteredId"
        :disabled="isLoading"
        class="px-3 py-2 rounded bg-stone-600 text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-60 text-center"
        placeholder="Your unique ID"
        @keyup.enter="handleJoin"
      />
      <button
        @click="handleJoin"
        :disabled="isLoading || !enteredId"
        class="px-4 py-2 mt-2 rounded bg-teal-600 hover:bg-teal-500 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold transition-colors w-full"
      >
        {{ isLoading ? "Joining..." : "Join Circle" }}
      </button>
      <p v-if="errorMessage" class="text-red-400 mt-3 text-sm">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Chat Screen -->
    <div
      v-else
      class="flex flex-col w-full max-w-2xl h-[90vh] bg-stone-700 rounded-lg shadow-lg overflow-hidden"
    >
      <h2
        class="text-lg font-semibold p-3 bg-stone-600 text-center border-b border-stone-500"
      >
        Welcome, {{ participant.name || participant._id }}! (Event:
        {{ eventId }})
      </h2>

      <!-- Message Display Area -->
      <div
        ref="messageContainer"
        class="flex-grow overflow-y-auto p-4 space-y-3 scroll-light"
      >
        <p v-if="isChatLoading" class="text-stone-400 italic text-center">
          Loading messages...
        </p>
        <p v-else-if="chatError" class="text-red-400 italic text-center">
          {{ chatError }}
        </p>
        <p
          v-else-if="chatContent.length === 0"
          class="text-stone-400 italic text-center"
        >
          No messages yet.
        </p>
        <div
          v-else
          v-for="(message, index) in chatContent"
          :key="index"
          class="flex flex-col"
        >
          <span class="text-xs text-stone-400 mb-1"
            >{{ message.entityId }} says:</span
          >
          <p class="bg-stone-600 p-3 rounded-lg max-w-md break-words">
            {{ message.text }}
          </p>
        </div>
      </div>

      <!-- Message Input Area -->
      <div class="p-3 bg-stone-600 border-t border-stone-500 flex gap-2">
        <input
          type="text"
          v-model="newMessage"
          :disabled="isSending"
          class="flex-grow px-3 py-2 rounded bg-stone-500 text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type your message..."
          @keyup.enter="handleSendMessage"
        />
        <button
          @click="handleSendMessage"
          :disabled="isSending || !newMessage"
          class="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {{ isSending ? "Sending..." : "Send" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// --- State ---
const eventId = "23punecc" // Our hardcoded event ID

// Validation State
const enteredId = ref("")
const participant = ref(null) // Stores { _id, name, role } from validation
const isLoading = ref(false)
const errorMessage = ref("")

// Chat State
const chatContent = ref([]) // Array to hold message objects { entityId, text }
const newMessage = ref("")
const isSending = ref(false)
const isChatLoading = ref(false)
const chatError = ref("")
const messageContainer = ref(null) // Ref for the scrollable message area

// --- Methods ---

// 1. Validation
async function handleJoin() {
  if (!enteredId.value || isLoading.value) return
  isLoading.value = true
  errorMessage.value = ""
  participant.value = null // Reset participant on new attempt

  // Use the utility function
  const result = await apiValidateParticipant(enteredId.value)

  if (result?.success) {
    participant.value = result.participant
    console.log(`Validation successful:`, participant.value)
    // Validation successful, now fetch initial chat content
    fetchChatContent()
    // TODO: Persist participant._id in localStorage/IndexedDB for next visit?
  } else {
    errorMessage.value =
      result?.message || "An unknown error occurred during validation."
  }

  isLoading.value = false
}

// 2. Fetching Chat Content
async function fetchChatContent() {
  if (!participant.value?._id) return // Need a validated participant
  isChatLoading.value = true
  chatError.value = ""
  console.log(
    `Fetching event ${eventId} for participant ${participant.value._id}`
  )

  // Use the utility function
  const eventData = await apiGetEvent(eventId, participant.value._id)

  if (eventData) {
    console.log("Event data received:", eventData)
    chatContent.value = eventData.content || [] // Update chat content
    scrollToBottom() // Scroll down after loading messages
  } else {
    console.error("Failed to fetch event data.")
    chatError.value = "Could not load chat messages. Please try again later."
    chatContent.value = [] // Clear content on error
  }
  isChatLoading.value = false
}

// 3. Sending Messages
async function handleSendMessage() {
  if (!newMessage.value || isSending.value || !participant.value?._id) return
  isSending.value = true
  const textToSend = newMessage.value
  newMessage.value = "" // Clear input optimistically

  console.log(`Sending message from ${participant.value._id}: "${textToSend}"`)

  // Use the utility function
  const result = await apiPostMessage(
    eventId,
    participant.value._id,
    textToSend
  )

  if (result?.success) {
    console.log("Message posted successfully.")
    // Refresh the chat content to show the new message
    await fetchChatContent()
    // Scroll down after sending and refreshing
    // scrollToBottom(); // fetchChatContent already calls this
  } else {
    console.error("Failed to send message:", result?.message)
    // Handle error - maybe show a temporary error message?
    newMessage.value = textToSend // Put text back in input on failure?
    chatError.value = `Failed to send: ${result?.message || "Unknown error"}` // Show error briefly?
  }

  isSending.value = false
}

// 4. Auto-scroll
function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      // Use our utility if preferred: scrollToBot(messageContainer.value, 'auto'); // Use 'auto' for instant scroll on load/send
    }
  })
}

// Optional: Fetch chat content automatically if participant info is already known (e.g., from localStorage)
// onMounted(() => {
//   // Check localStorage/IndexedDB for persisted participant ID
//   const persistedId = localStorage.getItem('circleParticipantId');
//   if (persistedId) {
//     // You might want to re-validate here for security or just assume it's valid
//     // For simplicity now, let's just pre-fill and attempt join
//     enteredId.value = persistedId;
//     handleJoin(); // Attempt to join automatically
//   }
// });
</script>
