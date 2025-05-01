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
        class="px-3 py-2 rounded bg-stone-600 text-stone-200 focus:outline-none focus:ring-4 focus:ring-stone-500 max-w-[700px] text-center text-lg font-semibold"
        placeholder=""
        @keyup.enter="handleJoin"
      />
      <button
        @click="handleJoin"
        :disabled="isLoading || !enteredId"
        class="px-4 py-2 mt-2 rounded bg-stone-500 hover:bg-stone-400 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold w-full disabled:text-stone-400 text-lg"
      >
        {{ isLoading ? "проверка..." : "войти в круг" }}
      </button>
      <p v-if="errorMessage" class="text-red-400 mt-3 text-sm">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Chat Screen -->
    <div v-else class="flex flex-col gap-2 items-center">
      <div
        class="flex flex-col w-[700px] max-w-2xl h-[90vh] bg-stone-500 rounded-lg shadow-lg overflow-hidden scroll-wide"
      >
        <!-- Message Display Area -->
        <div
          ref="messageContainer"
          class="flex-grow overflow-y-auto p-4 space-y-3 text-lg w-full scroll-wide gap-3"
        >
          <!-- <p
          v-if="isChatLoading"
          class="text-stone-300 text-lg italic text-center"
        >
          загрузка сообщений...
        </p> -->
          <p v-if="chatError" class="text-red-400 italic text-center w-full">
            {{ chatError }}
          </p>
          <div
            v-else
            v-for="(message, index) in chatContent"
            :key="message._id || `msg-${index}`"
            class="flex flex-col w-full rounded-lg overflow-hidden"
          >
            <div
              class="text-lg px-5 font-semibold bg-stone-600 text-stone-300 pb-2 pt-1 w-full"
            >
              {{ getDisplayName(message.entityId) }}
            </div>
            <p
              class="bg-stone-400 bg-lines pt-3 pb-5 px-5 break-words whitespace-pre-wrap w-full text-stone-700 text-xl"
              :style="{ backgroundPositionY: `-16px` }"
            >
              {{ message.text }}
              <span class="text-stone-500" v-if="message.isStreaming">⬤</span>
            </p>
          </div>
        </div>

        <!-- Generation Status -->
        <div
          v-if="isSending || isGenerating || generationError"
          class="p-2 text-center font-semibold text-lg"
          :class="
            generationError
              ? 'text-red-400 bg-red-900/30'
              : 'text-stone-400 bg-stone-700'
          "
        >
          {{
            generationError
              ? `${generationError}`
              : isSending
              ? "отправка сообщения..."
              : "эхо говорит..."
          }}
        </div>

        <!-- Message Input Area -->
        <div class="bg-stone-600 flex flex-col gap-3 p-3">
          <div class="flex gap-3">
            <textarea
              type="text"
              v-model="newMessage"
              :disabled="isSending || isGenerating"
              class="flex-grow px-3 py-2 rounded bg-stone-500 text-stone-200 focus:outline-none focus:ring-4 focus:ring-stone-400 resize-none h-[120px] text-lg placeholder:text-stone-400 placeholder:italic scroll-wide disabled:cursor-not-allowed"
              placeholder="введите сообщение"
            />
            <div class="flex flex-col gap-2 items-center w-[130px]">
              <button
                @click="handleSendMessage"
                :disabled="isSending || !newMessage || isGenerating"
                class="px-4 py-2 rounded bg-stone-500 hover:bg-stone-400 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold text-lg disabled:text-stone-400 h-fit w-full"
              >
                {{ isSending ? "отправка..." : "отправить" }}
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="handleCopyContext"
              :disabled="isCopying"
              class="w-full px-2 py-1 rounded bg-stone-500 hover:bg-stone-400 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold text-lg"
            >
              {{ isCopying ? "скопировано" : "скопировать весь текст" }}
            </button>
            <button
              @click="handleGenerateResponse"
              :disabled="
                isSending ||
                isGenerating ||
                isGenDisabled ||
                currentUsage === null
              "
              class="px-2 w-full py-2 rounded bg-stone-500 hover:bg-stone-400 disabled:bg-stone-500 disabled:cursor-not-allowed text-white font-semibold text-lg disabled:text-stone-400"
            >
              дать эхо высказаться
              <span class="font-semibold font-fira-code text-[16px]">
                {{
                  getTokens(assembleContext()) > 10
                    ? `~${getTokens(assembleContext())}`
                    : "~..."
                }}
              </span>
            </button>
          </div>
        </div>
      </div>
      <span class="font-semibold font-fira-code text-stone-400">
        {{
          currentUsage !== null
            ? `лимит на сегодня ${currentUsage} / ${tokenLimit}`
            : "загрузка лимита..."
        }}
      </span>
    </div>
  </div>
</template>

<script setup>
// --- State ---
const eventId = "xs6g4dmc" // test event
// const eventId = "23punecc"
const digitalEntityId = "43ginyi0" // Эхо's ID
const tokenLimit = 900_000

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
const currentUsage = ref(null)
const estimatedCost = ref(500) // Initial rough estimate

const participantNameMap = ref({})

const isCopying = ref(false)

// Computed property to disable generation button
const isGenDisabled = computed(() => {
  if (currentUsage.value === null) return
  return (
    currentUsage.value + getTokens(assembleContext()) + estimatedCost.value >=
    tokenLimit
  )
})

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
      if (!uniqueIds.includes(digitalEntityId)) uniqueIds.push(digitalEntityId)

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
function scrollToBottom(behavior = "smooth") {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTo({
        top: messageContainer.value.scrollHeight,
        behavior: behavior,
      })
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
      generationError.value =
        "лимит токенов на сегодня превышен, обновится в 3 утра по москве"
      console.warn(generationError.value)
    }
  } else {
    currentUsage.value = null
    generationError.value = "Could not fetch token usage." // Show error clearly
    console.error("Failed to fetch token usage.")
  }
}

function assembleContext(forLLM = true) {
  // Add parameter to control output
  let contextString = ""
  // Keep existing logic to build the contextString using getDisplayName etc...
  chatContent.value.forEach((msg) => {
    if (msg.isStreaming) return
    const entityName = getDisplayName(msg.entityId)
    if (forLLM) {
      contextString += `<${entityName}>\n${msg.text}\n</${entityName}>\n\n`
    } else {
      contextString += "-----------------------------------------------\n"
      contextString += `${entityName}\n\n${msg.text}\n`
      contextString += "-----------------------------------------------\n\n"
    }
  })
  if (forLLM) contextString += `<echo>\n`

  estimatedCost.value = Math.floor(contextString.length / 3) + 500
  console.log(
    `Assembled Context (${forLLM ? "for LLM, " : ""}${
      estimatedCost.value
    } estimated tokens)`
  )
  return contextString
}

async function handleCopyContext() {
  const contextToCopy = assembleContext(false)
  await clipboard({ input: contextToCopy, locked: isCopying, lockTime: 1000 })
}

// 7. Handle Generate Button Click
async function handleGenerateResponse() {
  if (isGenerating.value || !participant.value?._id) return

  isGenerating.value = true

  if (isGenDisabled.value) {
    alert(generationError.value || "Token limit reached or usage unavailable.")
    return
  }

  generationError.value = ""

  const context = assembleContext()
  console.log(context)

  const streamMessage = reactive({
    entityId: digitalEntityId,
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
        setTimeout(checkTokenLimit, 10_000)
      },
      onError: (error) => {
        console.error("Error during generation stream:", error)
        generationError.value = error.message || "Unknown generation error."
        streamMessage.isStreaming = false
        streamMessage.text += `\n\n[ERROR: ${generationError.value}]`
        saveAiMessage(streamMessage.text) // Save partial + error
        isGenerating.value = false
        setTimeout(checkTokenLimit, 10_000)
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

  const result = await apiPostMessage(eventId, digitalEntityId, cleanText)
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
  return participantNameMap.value[entityId]
}

// --- Lifecycle ---
onMounted(async () => {
  // Attempt to auto-join if participant ID is stored
  if (process.client) {
    const persistedId = localStorage.getItem("circleParticipantId")
    if (persistedId) {
      console.log("Found persisted participant ID:", persistedId)
      enteredId.value = persistedId
      await handleJoin()
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
