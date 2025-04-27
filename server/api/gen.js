// server/api/gen.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"

// Note: We might not need export const runtime = "edge" anymore
// if Nuxt/Nitro handles function type detection automatically based on usage.
// Let's leave it out for now and see if deployment still works correctly as Edge.
// If deployment fails as Edge, add `export const runtime = "edge"` back.

export default defineEventHandler(async (event) => {
  // ---- Shared: Parse body and Initialize LLM ----
  let provider, model, input, llm
  try {
    const body = await readBody(event)
    provider = body.provider || "google"
    model = body.model
    input = body.input

    if (!model || !input) {
      throw new Error("Missing required fields: model and input")
    }

    // Initialize the correct LLM based on provider
    if (provider === "openai") {
      console.log(
        `[gen.js] Initializing OpenAI model: ${model} (Env: ${process.env.NODE_ENV})`
      )
      llm = new ChatOpenAI({
        modelName: model,
        temperature: 1,
        openAIApiKey: process.env.OPENAI_API_KEY,
        streaming: true,
      })
    } else if (provider === "google") {
      console.log(
        `[gen.js] Initializing Google model: ${model} (Env: ${process.env.NODE_ENV})`
      )
      llm = new ChatGoogleGenerativeAI({
        model: model,
        temperature: 1,
        apiKey: process.env.GEMINI_API_KEY,
        // streaming: true, // Implicit with .stream()
      })
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }
  } catch (error) {
    console.error("[gen.js] Error during setup:", error)
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid request: ${error.message}`,
    })
  }

  const messages = [new HumanMessage({ content: input })]

  // ---- Environment-Specific Streaming Logic ----

  if (process.env.NODE_ENV === "development") {
    // --- LOCAL DEVELOPMENT (Node.js server) ---
    console.log("[gen.js] Using Node.js streaming logic for local dev.")
    try {
      // Set headers for Server-Sent Events
      event.node.res.setHeader("Content-Type", "text/event-stream")
      event.node.res.setHeader("Cache-Control", "no-cache")
      event.node.res.setHeader("Connection", "keep-alive")
      event.node.res.statusCode = 200 // Explicitly set OK status

      for await (const chunk of await llm.stream(messages)) {
        // Your console.log proved this part works
        // console.log("Local Dev Chunk:", chunk?.content);
        if (chunk?.content) {
          // Write chunk in SSE format (data: ...\n\n) - standard Node method
          // Note: Some simple implementations just write raw text, depends on client EventSource needs.
          // Let's just write raw text for now, as apiGen seems to handle it.
          event.node.res.write(`${chunk.content}`)
        }
      }
      // Signal the end of the stream for Node.js response
      event.node.res.end()
      console.log("[gen.js] Node.js stream ended successfully (local dev).")
    } catch (error) {
      console.error(
        `[gen.js] Error during Node.js LLM stream (local dev):`,
        error
      )
      // Try to end the response gracefully if possible
      if (!event.node.res.writableEnded) {
        try {
          event.node.res.end()
        } catch (e) {}
      }
      // Let Nuxt handle the error display
      throw createError({
        statusCode: 500,
        statusMessage: `LLM stream failed: ${error.message}`,
      })
    }
    // IMPORTANT: Return undefined or nothing here for Node.js streams handled via res.write/end
    // Do NOT return a Response object.
  } else {
    // --- PRODUCTION / PREVIEW (Vercel Edge or similar) ---
    console.log("[gen.js] Using Edge streaming logic (TransformStream).")
    try {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()

      // Run the stream in parallel, don't await the whole loop here
      // Await the async function IIFE itself
      ;(async () => {
        try {
          for await (const chunk of await llm.stream(messages)) {
            // console.log("Edge Chunk:", chunk?.content);
            if (chunk?.content) {
              await writer.write(encoder.encode(`${chunk.content}`))
            }
          }
          await writer.close() // Close writer when LLM stream finishes
          console.log("[gen.js] Edge stream writer closed successfully.")
        } catch (streamError) {
          console.error("[gen.js] Error writing to Edge stream:", streamError)
          await writer.abort(streamError) // Abort writer on error
          // Don't rethrow here, let the outer catch handle it if needed,
          // but ensure the stream signals an error.
        }
      })() // Immediately invoke the async function

      // Return the standard Response object with the readable stream
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive", // Keep-alive might be implicit but good to include
        },
        // Status defaults to 200 OK
      })
    } catch (error) {
      console.error(`[gen.js] Error setting up Edge LLM stream:`, error)
      // Error setting up the stream itself
      throw createError({
        statusCode: 500,
        statusMessage: `LLM stream setup failed: ${error.message}`,
      })
    }
  }
})
