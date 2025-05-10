// utils/api/apiGetUsage.js
export default async function (provider = "openai") {
  // const baseURL = import.meta.dev ? "https://stone-seven.vercel.app" : ""
  const baseURL = import.meta.dev
    ? "https://stone-git-circle-event-list-gukis-projects.vercel.app"
    : ""

  try {
    const response = await fetch(`${baseURL}/getUsage`, {
      method: "POST", // Changed to POST to send body easily
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
      //
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `API request failed: ${response.status} - ${
          errorData.statusMessage || response.statusText || "Unknown Error"
        }`
      )
    }

    const data = await response.json()
    return data.totalTokens // Return just the number
  } catch (error) {
    console.error("Error fetching API usage from server:", error)
    // Decide how to handle client-side: return null, 0, or re-throw?
    // Returning null might be clearest for UI handling.
    return null
  }
}
