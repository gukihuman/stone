// api/gen.js
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai"
import { HumanMessage } from "@langchain/core/messages"

export const config = { runtime: "edge" }

export default async function handler(req) {
  /* 🌐 CORS */
  if (req.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })

  /* 📦 Body */
  const { provider, model, input } = (await req.json().catch(() => ({}))) || {}
  if (!provider || !model || !input)
    return new Response(JSON.stringify({ error: "incorrect body" }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    })

  /* 🔮 LLM  */
  const llm =
    provider === "openai"
      ? new ChatOpenAI({ modelName: model, temperature: 1 })
      : provider === "togetherai"
      ? new ChatTogetherAI({ model, temperature: 1 })
      : new ChatGoogleGenerativeAI({ model, temperature: 1 })

  /* 🚰 Stream */
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
      "Access-Control-Allow-Origin": "*",
    },
  })
}
