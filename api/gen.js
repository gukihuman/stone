// api/edge/gen.js
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage } from "@langchain/core/messages"

export const config = { runtime: "edge" }

export default async function handler(req) {
  // Parse JSON body
  const { provider = "google", model, input } = await req.json()
  if (!model || !input)
    return new Response(JSON.stringify({ error: "model & input required" }), {
      status: 400,
    })

  // Select LLM
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

  // Stream ↦ TextEncoder ↦ TransformStream
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  ;(async () => {
    try {
      for await (const chunk of await llm.stream([
        new HumanMessage({ content: input }),
      ])) {
        if (chunk?.content) await writer.write(enc.encode(chunk.content))
      }
      writer.close()
    } catch (e) {
      writer.abort(e)
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  })
}
