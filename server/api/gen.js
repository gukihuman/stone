import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"

export default defineEventHandler(async (event) => {
  let provider, model, input

  try {
    const body = await readBody(event)
    provider = body.provider || "google" // Default to google if not specified
    model = body.model
    input = body.input

    if (!model || !input) {
      throw new Error(
        "Missing required fields in request body: model and input"
      )
    }
  } catch (error) {
    console.error("Error reading gen request body:", error)
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid request body. ${error.message}`,
    })
  }

  let llmModel

  try {
    if (provider === "openai") {
      console.log(`Initializing OpenAI model: ${model}`)
      llmModel = new ChatOpenAI({
        modelName: model, // Ensure model name compatibility (e.g., "gpt-4o")
        temperature: 1, // Or configure as needed
        openAIApiKey: process.env.OPENAI_API_KEY, // Explicitly pass key if needed, though Langchain often picks it up
        streaming: true, // Ensure streaming is enabled
      })
    } else if (provider === "google") {
      console.log(`Initializing Google GenAI model: ${model}`)
      llmModel = new ChatGoogleGenerativeAI({
        model: model, // Correct parameter for Google
        temperature: 1,
        apiKey: process.env.GEMINI_API_KEY, // Ensure correct API key env var
        // streaming: true, // Streaming is default for .stream()
      })
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const messages = [new HumanMessage({ content: input })]

    // Set headers for streaming response
    event.node.res.setHeader("Content-Type", "text/event-stream")
    event.node.res.setHeader("Cache-Control", "no-cache")
    event.node.res.setHeader("Connection", "keep-alive")
    // Setting status code explicitly might be good practice
    event.node.res.statusCode = 200

    console.log(`Streaming response from ${provider} model ${model}...`)
    // Langchain stream method handles closing the connection implicitly
    for await (const chunk of await llmModel.stream(messages)) {
      // console.log("Chunk:", chunk.content); // Log chunk for debugging
      if (chunk?.content) {
        event.node.res.write(`${chunk.content}`) // Write only the content part
      }
    }
    // Ensure the stream is properly ended after the loop finishes
    event.node.res.end()
    console.log(`Stream ended for ${provider} model ${model}.`)
  } catch (error) {
    console.error(`Error during LLM call (${provider} ${model}):`, error)
    // Ensure we attempt to end the response even on error
    if (!event.node.res.writableEnded) {
      try {
        // Maybe write an error marker? Careful not to break EventSource protocol
        // event.node.res.write(`data: {"error": "${error.message}"}\n\n`);
        event.node.res.end()
      } catch (endError) {
        console.error(
          "Error trying to end response after initial error:",
          endError
        )
      }
    }
    // Re-throw error for Nuxt default error handling? Or return structured error?
    // Throwing might be simpler for now.
    throw createError({
      statusCode: 500,
      statusMessage: `LLM generation failed: ${error.message}`,
    })
  }
  // Note: We don't need a final return here because the stream handles the response
})
