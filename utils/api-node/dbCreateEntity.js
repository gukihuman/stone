// utils/api-node/dbCreateEntity.js
export default async function dbCreateEntity(entityData) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const response = await fetch(`${baseURL}/api-node/db-create-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entityData),
    })
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error(error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
