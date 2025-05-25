// utils/api-node/dbRemoveEntity.js
export default async function dbRemoveEntity(entityId) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stone-id not found for dbRemoveEntity")

    const body = { entityId, stoneId }
    const response = await fetch(`${baseURL}/api-node/db-remove-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error(`client error in dbRemoveEntity for id ${entityId}`, error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
