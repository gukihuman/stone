// utils/api-node/dbGetEntities.js
export default async function dbGetEntities(stoneId) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const response = await fetch(`${baseURL}/api-node/db-get-entities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stoneId: stoneId }),
    })
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(
        `API Error ${response.status}: ${
          errData.statusMessage || response.statusText
        }`
      )
    }
    return await response.json()
  } catch (error) {
    console.error("Client error in dbGetEntities:", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
