// server/routes/api-node/get-usage-openai.js
import { defineEventHandler, setHeader, createError } from "h3"

export default defineEventHandler(async (event) => {
  /* CORS */
  setHeader(event, "Access-Control-Allow-Origin", "*")
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS")
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type")
  if (event.method === "OPTIONS") return ""
  if (event.method !== "GET") {
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }

  const apiKey = process.env.OPENAI_API_KEY_ADMIN
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "API key missing" })
  }

  // midnight UTC today
  const nowUTC = new Date()
  nowUTC.setUTCHours(0, 0, 0, 0)
  const startTimeUnix = Math.floor(nowUTC.getTime() / 1000)

  const url =
    `https://api.openai.com/v1/organization/usage/completions` +
    `?start_time=${startTimeUnix}` +
    `&bucket_width=1d&limit=1` +
    `&group_by=model`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        `OpenAI Usage API ${res.status}: ${
          err?.error?.message || res.statusText
        }`
      )
    }

    const usage = await res.json()
    const byModel = {}

    // single bucket (limit=1), possibly many grouped results
    if (usage.data?.[0]?.results?.length) {
      usage.data[0].results.forEach((r) => {
        const tokens = (r.input_tokens || 0) + (r.output_tokens || 0)
        const model = r.model || "unknown"
        byModel[model] = (byModel[model] || 0) + tokens
      })
    }

    return byModel // e.g. { "gpt-4o-mini-2024‑07‑18": 12345, ... }
  } catch (err) {
    console.error("openai usage fetch error", err)
    throw createError({
      statusCode: 503,
      statusMessage: `failed to fetch usage ${err.message}`,
    })
  }
})
