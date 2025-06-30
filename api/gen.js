// api/gen.js
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai"
import { HumanMessage } from "@langchain/core/messages"

export const config = { runtime: "edge" }

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  const body = (await req.json().catch(() => ({}))) || {}
  const { provider, model, input, accessToken } = body

  const secret = process.env.ACCESS_TOKEN
  if (!secret) {
    console.error("ACCESS_TOKEN environment variable is not set for /api/gen")
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
  if (!accessToken || accessToken !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

  if (!provider || !model || !input) {
    return new Response(
      JSON.stringify({ error: "Incorrect body parameters" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }

  const llm =
    provider === "openai"
      ? new ChatOpenAI({ modelName: model, temperature: 1 })
      : provider === "togetherai"
      ? new ChatTogetherAI({ model, temperature: 1 })
      : new ChatGoogleGenerativeAI({ model, temperature: 1 })

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  ;(async () => {
    try {
      for await (const chunk of await llm.stream([
        new HumanMessage({ content: input }),
      ])) {
        if (chunk?.content) {
          await writer.write(enc.encode(chunk.content))
        }
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
