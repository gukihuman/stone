import { defineEventHandler, readBody } from "h3"

export default defineEventHandler(async (event) => {
  const { provider } = await readBody(event).catch(() => ({
    provider: "openai",
  })) // Default to openai if body fails or is empty

  if (provider !== "openai") {
    // Placeholder for future providers
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

  // Calculate start_time: Midnight GMT of the current day
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0) // Set to midnight GMT
  const startTimeUnix = Math.floor(today.getTime() / 1000)

  const apiUrl = `https://api.openai.com/v1/organization/usage/completions?start_time=${startTimeUnix}&bucket_width=1d&limit=1`

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
        `OpenAI API request failed: ${response.status} - ${
          errorData?.error?.message || response.statusText || "Unknown Error"
        }`
      )
    }

    const usageData = await response.json()
    let totalTokens = 0

    // Sum tokens from the results within the first (and only) bucket
    if (
      usageData.data &&
      usageData.data.length > 0 &&
      usageData.data[0].results
    ) {
      usageData.data[0].results.forEach((result) => {
        totalTokens += (result.input_tokens || 0) + (result.output_tokens || 0)
      })
    }

    return { provider: "openai", totalTokens }
  } catch (error) {
    console.error("Error fetching OpenAI usage:", error)
    throw createError({
      statusCode: 503, // Service Unavailable or Bad Gateway might fit
      statusMessage: `Failed to fetch usage from OpenAI: ${error.message}`,
    })
  }
})
