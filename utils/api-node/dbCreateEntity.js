// utils/api-node/db/create-entity.js
export default async function createEntity(entityData) {
  const baseURL = import.meta.dev
    ? useRuntimeConfig().public.vercelBaseUrl || "http://localhost:3000"
    : ""
  try {
    const response = await fetch(`${baseURL}/api-node/db/create-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entityData),
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
    console.error("Client error in createEntity:", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
