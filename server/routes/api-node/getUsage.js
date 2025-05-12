// server/routes/api-node/getUsageOpenAI.js
import { defineEventHandler, setHeader, createError } from "h3"

export default defineEventHandler(async (event) => {
  /* CORS (simple GET still nice to keep open) */
  setHeader(event, "Access-Control-Allow-Origin", "*")
  setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS")
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type")
  if (event.method === "OPTIONS") return ""
  if (event.method !== "GET") {
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }
  const apiKey = process.env.OPENAI_API_KEY_ADMIN
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "OpenAI API key not configured.",
    })
  }
  // midnight UTC today
  const nowUTC = new Date()
  nowUTC.setUTCHours(0, 0, 0, 0)
  const startTimeUnix = Math.floor(nowUTC.getTime() / 1000)

  const url =
    `https://api.openai.com/v1/organization/usage/completions` +
    `?start_time=${startTimeUnix}&bucket_width=1d&limit=1`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(
        `OpenAI API failed: ${res.status} – ${
          errData?.error?.message || res.statusText
        }`
      )
    }

    const usage = await res.json()
    let totalTokens = 0

    if (usage.data?.[0]?.results?.length) {
      usage.data[0].results.forEach((r) => {
        totalTokens += (r.input_tokens || 0) + (r.output_tokens || 0)
      })
    }

    return { totalTokens }
  } catch (err) {
    console.error("openai usage fetch error", err)
    throw createError({
      statusCode: 503,
      statusMessage: `failed to fetch usage ${err.message}`,
    })
  }
})
