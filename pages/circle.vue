<template>
  <div
    class="flex flex-col h-screen bg-stone-800 text-stone-300 p-4 items-center justify-center"
  >
    <!-- Validation Screen -->
    <div
      v-if="!participant"
      class="flex flex-col gap-2 items-center bg-stone-700 p-6 rounded-lg shadow-lg"
    >
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
      <!-- Message Display Area -->
      <div
        ref="messageContainer"
        class="flex-grow overflow-y-auto p-4 space-y-3 scroll-light"
      >
        <p
          v-if="isChatLoading"
          class="text-stone-300 text-lg italic text-center"
        >
          загрузка сообщений...
        </p>
        <p v-else-if="chatError" class="text-red-400 italic text-center">
          {{ chatError }}
        </p>
        <div
          v-else
          v-for="(message, index) in chatContent"
          :key="message._id || `msg-${index}`"
          class="flex flex-col"
        >
          <span class="text-lg text-stone-300 mb-1">
            {{ getDisplayName(message.entityId) }}
          </span>
          <p
            class="bg-stone-600 p-3 rounded-lg max-w-md break-words whitespace-pre-wrap"
            :class="{ 'opacity-70 italic': message.isStreaming }"
          >
            {{ message.text }}<span v-if="message.isStreaming">▍</span>
          </p>
        </div>
      </div>

      <!-- Generation Status -->
      <div
        v-if="isGenerating || generationError"
        class="p-2 text-center text-sm"
        :class="
          generationError
            ? 'text-red-400 bg-red-900/30'
            : 'text-stone-400 bg-stone-600'
        "
      >
        {{ generationError ? `${generationError}` : "Эхо печатает..." }}
      </div>

      <!-- Message Input Area -->
      <div class="p-3 bg-stone-600 border-t border-stone-500 flex gap-2">
        <input
          type="text"
          v-model="newMessage"
          :disabled="isSending || isGenerating"
          class="flex-grow px-3 py-2 rounded bg-stone-500 text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Type your message..."
          @keyup.enter="handleSendMessage"
        />
        <button
          @click="handleSendMessage"
          :disabled="isSending || !newMessage || isGenerating"
          class="px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {{ isSending ? "Sending..." : "Send" }}
        </button>
        <button
          @click="handleGenerateResponse"
          :disabled="isSending || isGenerating || isGenDisabled"
          class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          title="Generate response from Эхо"
        >
          {{ isGenerating ? "Thinking..." : "Generate" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const ESTIMATE_RESPONSE = 4000
// Imports are handled by Nuxt 3 auto-imports

// --- State ---
const eventId = "23punecc"
const aiEntityId = "43ginyi0" // Эхо's ID
const tokenLimit = 990_000

// Validation State
const enteredId = ref("")
const participant = ref(null)
const isLoading = ref(false)
const errorMessage = ref("")

// Chat State
const chatContent = ref([])
const newMessage = ref("")
const isSending = ref(false)
const isChatLoading = ref(false)
const chatError = ref("")
const messageContainer = ref(null)

// Generation State
const isGenerating = ref(false)
const generationError = ref("")
const currentUsage = ref(0)
const estimatedCost = ref(500) // Initial rough estimate

const participantNameMap = ref({})

// Computed property to disable generation button
const isGenDisabled = computed(
  () => currentUsage.value + estimatedCost.value >= tokenLimit
)

// --- Methods ---

// 1. Validation
async function handleJoin() {
  if (!enteredId.value || isLoading.value) return
  isLoading.value = true
  errorMessage.value = ""
  participant.value = null

  const result = await apiValidateParticipant(enteredId.value)

  if (result?.success) {
    participant.value = result.participant
    console.log(`Validation successful:`, participant.value)
    await fetchChatContent()
    await checkTokenLimit()
    // Persist participant ID for next visit
    if (process.client) {
      // Ensure localStorage is available
      localStorage.setItem("circleParticipantId", participant.value._id)
    }
  } else {
    errorMessage.value =
      result?.message || "An unknown error occurred during validation."
    if (process.client) {
      localStorage.removeItem("circleParticipantId") // Clear invalid ID
    }
  }
  isLoading.value = false
}

// 2. Fetching Chat Content
async function fetchChatContent() {
  if (!participant.value?._id) return
  isChatLoading.value = true
  chatError.value = ""
  console.log(
    `Fetching event ${eventId} for participant ${participant.value._id}`
  )

  const eventData = await apiGetEvent(eventId, participant.value._id)

  if (eventData) {
    console.log("Event data received")
    const content = eventData.content || []
    chatContent.value = content.map((msg) =>
      reactive({ ...msg, isStreaming: false })
    )

    // --- NEW: Fetch participant names ---
    if (content.length > 0) {
      const uniqueIds = [...new Set(content.map((msg) => msg.entityId))]
      // Also add the current user's ID if not already in messages, and AI ID
      if (!uniqueIds.includes(participant.value._id))
        uniqueIds.push(participant.value._id)
      if (!uniqueIds.includes(aiEntityId)) uniqueIds.push(aiEntityId)

      console.log("Fetching names for IDs:", uniqueIds)
      const participantsData = await apiGetParticipants(uniqueIds)
      if (participantsData) {
        participantNameMap.value = participantsData.reduce((map, p) => {
          map[p._id] = p.name || p._id // Use ID as fallback name
          return map
        }, {})
        console.log("Participant name map updated:", participantNameMap.value)
      } else {
        console.error("Failed to fetch participant names.")
        // Keep existing map or clear it? Maybe just log error for now.
      }
    }
    // --- End NEW ---

    scrollToBottom()
  } else {
    console.error("Failed to fetch event data.")
    chatError.value = "Could not load chat messages. Please try again later."
    chatContent.value = []
    participantNameMap.value = {} // Clear map on chat load error
  }
  isChatLoading.value = false
}

// 3. Sending Messages
async function handleSendMessage() {
  if (!newMessage.value || isSending.value || !participant.value?._id) return
  isSending.value = true
  const textToSend = newMessage.value
  newMessage.value = ""

  console.log(`Sending message from ${participant.value._id}: "${textToSend}"`)
  const result = await apiPostMessage(
    eventId,
    participant.value._id,
    textToSend
  )

  if (result?.success) {
    console.log("Message posted successfully.")
    await fetchChatContent() // Refresh chat immediately
  } else {
    console.error("Failed to send message:", result?.message)
    newMessage.value = textToSend
    chatError.value = `Failed to send: ${result?.message || "Unknown error"}` // Show error briefly? Reset later?
  }
  isSending.value = false
}

// 4. Auto-scroll
function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      // Or: scrollToBot(messageContainer.value, 'auto');
    }
  })
}

// 5. Check Token Limit
async function checkTokenLimit() {
  // Temporarily disable check if running locally without API key?
  // if (!process.env.OPENAI_API_KEY && process.dev) {
  //   console.warn("Skipping token check in dev without key.");
  //   currentUsage.value = 0;
  //   return;
  // }

  generationError.value = ""
  const usage = await apiGetUsage("openai")
  if (usage !== null) {
    currentUsage.value = usage
    console.log(`Current OpenAI Usage: ${currentUsage.value} / ${tokenLimit}`)
    if (isGenDisabled.value) {
      generationError.value = `лимит токенов на сегодня превышен, обновится в 3 утра по москве${
        currentUsage.value + ESTIMATE_RESPONSE
      }/${tokenLimit}`
      console.warn(generationError.value)
    }
  } else {
    currentUsage.value = 0
    generationError.value = "Could not fetch token usage." // Show error clearly
    console.error("Failed to fetch token usage.")
  }
}

// 6. Assemble Context for LLM (UPDATE THIS FUNCTION to use names)
function assembleContext() {
  let contextString = ""
  chatContent.value.forEach((msg) => {
    if (msg.isStreaming) return
    // Use display name from map, fallback to ID
    let entityTag = getDisplayName(msg.entityId)

    // Sanitize tag (replace spaces with underscores)
    entityTag = entityTag.replace(/\s+/g, "_")

    contextString += `<${entityTag}>\n${msg.text}\n</${entityTag}>\n\n`
  })
  contextString += `<echo>\n` // Still prompt echo

  estimatedCost.value = Math.floor(contextString.length / 3) + 500
  console.log(`Assembled Context (${estimatedCost.value} estimated tokens)`)
  return contextString
}

// 7. Handle Generate Button Click
async function handleGenerateResponse() {
  if (isGenerating.value || !participant.value?._id) return

  await checkTokenLimit()
  if (isGenDisabled.value) {
    alert(generationError.value || "Token limit reached or usage unavailable.")
    return
  }

  isGenerating.value = true
  generationError.value = ""

  const context = assembleContext()
  console.log(context)

  const streamMessage = reactive({
    entityId: aiEntityId,
    text: "",
    isStreaming: true,
  })
  chatContent.value.push(streamMessage)
  scrollToBottom()

  try {
    await apiGen({
      provider: "openai",
      model: "gpt-4.5-preview",
      input: context,
      onChunk: (chunk) => {
        console.log(chunk)
        streamMessage.text += chunk
        scrollToBottom()
      },
      onComplete: (finalText) => {
        console.log("Generation complete.")
        streamMessage.isStreaming = false
        saveAiMessage(finalText)
        isGenerating.value = false
        checkTokenLimit() // Update usage after successful generation
      },
      onError: (error) => {
        console.error("Error during generation stream:", error)
        generationError.value = error.message || "Unknown generation error."
        streamMessage.isStreaming = false
        streamMessage.text += `\n\n[ERROR: ${generationError.value}]`
        saveAiMessage(streamMessage.text) // Save partial + error
        isGenerating.value = false
        checkTokenLimit() // Update usage even after error
      },
    })
  } catch (setupError) {
    console.error("Error setting up generation:", setupError)
    generationError.value = setupError.message || "Failed to start generation."
    streamMessage.isStreaming = false // Ensure streaming stops
    streamMessage.text += `\n\n[SETUP ERROR: ${generationError.value}]`
    // Check if streamMessage was actually added before trying to save partial
    if (chatContent.value.includes(streamMessage)) {
      saveAiMessage(streamMessage.text) // Save placeholder + error
    }
    isGenerating.value = false
    checkTokenLimit()
  }
}

// 8. Save AI Message (Helper function)
async function saveAiMessage(textToSave) {
  if (!textToSave && textToSave !== "") return // Don't save if truly empty (e.g., setup error before any text)

  console.log(`Attempting to save AI message...`)
  let cleanText = textToSave.trim()
  // Basic tag stripping - might need refinement if tags appear mid-text
  if (cleanText.startsWith("<echo>")) cleanText = cleanText.slice(6).trim()
  if (cleanText.endsWith("</echo>")) cleanText = cleanText.slice(0, -7).trim()

  // Avoid saving empty strings after stripping tags/errors
  if (!cleanText) {
    console.warn(
      "Attempted to save empty AI message after cleaning. Aborting save."
    )
    const index = chatContent.value.findIndex((msg) => msg.text === "")
    if (index > -1) chatContent.value.splice(index, 1)
    return
  }

  const result = await apiPostMessage(eventId, aiEntityId, cleanText)
  if (!result?.success) {
    console.error("Failed to save AI message to DB:", result?.message)
    generationError.value = `Generation done, but save failed: ${
      result?.message || "DB error"
    }`
    // Mark the displayed message as having a save error?
    const messageWithError = chatContent.value.find(
      (msg) => msg === streamMessage
    )
    if (messageWithError) messageWithError.saveError = true // Add a flag for UI
  } else {
    console.log("AI message saved successfully to DB.")
    // Optional: Fetch again to get DB _id etc. for the message?
    // await fetchChatContent();
  }
}

function getDisplayName(entityId) {
  // Lookup name, fallback to ID
  return participantNameMap.value[entityId] || entityId
}

// --- Lifecycle ---
onMounted(async () => {
  // Attempt to auto-join if participant ID is stored
  if (process.client) {
    const persistedId = localStorage.getItem("circleParticipantId")
    if (persistedId) {
      console.log("Found persisted participant ID:", persistedId)
      enteredId.value = persistedId
      await handleJoin() // Use await to ensure it completes before potential next steps
    }
  }
})
</script>

<style scoped>
/* Blinking cursor effect */
@keyframes blink {
  50% {
    opacity: 0;
  }
}
span[v-if="message.isStreaming"] {
  display: inline-block;
  width: 2px; /* Adjust width as needed */
  height: 1em; /* Match line height */
  background-color: currentColor;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  vertical-align: text-bottom;
}
</style>
