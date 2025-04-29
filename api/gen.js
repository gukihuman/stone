// server/api/gen.ts ----------------------------------------------------------
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage } from "@langchain/core/messages"

export const runtime = "edge" // ⚡ make ONLY this route an Edge Function
export const config = { runtime: "edge" }

export default defineEventHandler(async (event) => {
  // 1 · parse body -----------------------------------------------------------
  const { provider = "google", model, input } = await readBody(event)
  if (!model || !input) {
    throw createError({
      statusCode: 400,
      statusMessage: "model & input required",
    })
  }

  // 2 · init model -----------------------------------------------------------
  const llm =
    provider === "openai"
      ? new ChatOpenAI({
          modelName: model,
          temperature: 1,
          openAIApiKey: process.env.OPENAI_API_KEY,
        })
      : new ChatGoogleGenerativeAI({
          model,
          temperature: 1,
          apiKey: process.env.GEMINI_API_KEY,
        })

  // 3 · stream response ------------------------------------------------------
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  ;(async () => {
    try {
      for await (const chunk of await llm.stream([
        new HumanMessage({ content: input }),
      ])) {
        if (chunk?.content) await writer.write(encoder.encode(chunk.content))
      }
      await writer.close()
    } catch (err) {
      await writer.abort(err)
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  })
})
