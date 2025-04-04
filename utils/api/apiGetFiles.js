export default async function (params) {
  if (!params.path) return
  try {
    const response = await fetch("/api/getFiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json() // Attempt to get error details
      throw new Error(
        `API request failed: ${response.status} - ${
          errorData.statusMessage || "Unknown Error"
        }`
      )
    }

    return await response.json() // Return the parsed JSON data
  } catch (error) {
    console.error("Error in getFiles:", error)
    throw error // Re-throw the error to be handled by the caller
  }
}
