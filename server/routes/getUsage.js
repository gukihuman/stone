// server/routes/getUsage.js
import { defineEventHandler, readBody, setHeader, createError } from "h3"

/**
 * GET/POST /getUsage
 * Returns { provider: "openai", totalTokens: number }
 * CORS: Allows ALL origins (Access-Control-Allow-Origin: *)
 */
export default defineEventHandler(async (event) => {
  /* ------------------------------------------------- *
   * 🌐 CORS for everyone
   * ------------------------------------------------- */
  setHeader(event, "Access-Control-Allow-Origin", "*") // ← open wide
  setHeader(event, "Access-Control-Allow-Methods", "POST, OPTIONS")
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type")

  // Respond to pre-flight OPTIONS
  if (event.method === "OPTIONS") return ""

  /* ------------------------------------------------- *
   * ✨ Original logic
   * ------------------------------------------------- */
  const { provider = "openai" } = await readBody(event).catch(() => ({}))

  if (provider !== "openai") {
    throw createError({
      statusCode: 400,
      statusMessage: `Provider '${provider}' not currently supported for usage checks.`,
    })
  }

  const apiKey = process.env.OPENAI_API_KEY_ADMIN
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "OpenAI API key not configured on the server.",
    })
  }

  // Midnight UTC today
  const nowUTC = new Date()
  nowUTC.setUTCHours(0, 0, 0, 0)
  const startTimeUnix = Math.floor(nowUTC.getTime() / 1000)

  const apiUrl =
    `https://api.openai.com/v1/organization/usage/completions` +
    `?start_time=${startTimeUnix}&bucket_width=1d&limit=1`

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      throw new Error(
        `OpenAI API request failed: ${response.status} – ${
          errorData?.error?.message || response.statusText || "Unknown Error"
        }`
      )
    }

    const usageData = await response.json()
    let totalTokens = 0

    if (usageData.data?.length && usageData.data[0].results?.length) {
      usageData.data[0].results.forEach((r) => {
        totalTokens += (r.input_tokens || 0) + (r.output_tokens || 0)
      })
    }

    return { provider: "openai", totalTokens }
  } catch (err) {
    console.error("Error fetching OpenAI usage:", err)
    throw createError({
      statusCode: 503,
      statusMessage: `Failed to fetch usage from OpenAI: ${err.message}`,
    })
  }
})
