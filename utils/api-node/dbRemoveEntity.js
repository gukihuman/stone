// utils/api-node/dbRemoveEntity.js
export default async function dbRemoveEntity(entityId) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const response = await fetch(`${baseURL}/api-node/db-remove-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityId: entityId }),
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
    console.error(`Client error in dbRemoveEntity for ID ${entityId}:`, error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
