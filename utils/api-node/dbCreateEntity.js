// utils/api-node/dbCreateEntity.js
export default async function dbCreateEntity(entityData) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = localStorage.getItem("stone-id")
    if (!stoneId) {
      throw new Error(
        "stone-id not found in local storage for dbCreateEntity call"
      )
    }
    const bodyToSend = { ...entityData, stoneId }
    const response = await fetch(`${baseURL}/api-node/db-create-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error("client error in dbCreateEntity", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
