// utils/api-node/dbGetEntities.js
export default async function dbGetEntities() {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = localStorage.getItem("stone-id")
    if (!stoneId) throw new Error("stone-id not found in local storage")
    const response = await fetch(`${baseURL}/api-node/db-get-entities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stoneId: stoneId }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error("client error in dbGetEntities", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
