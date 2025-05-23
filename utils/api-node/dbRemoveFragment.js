// utils/api-node/dbRemoveFragment.js
export default async function dbRemoveFragment(id) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = localStorage.getItem("stone-id")
    if (!stoneId) throw new Error("stone-id not found in local storage")
    const body = { id, stoneId }
    const response = await fetch(`${baseURL}/api-node/db-remove-fragment`, {
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
    console.error(`error in dbRemoveFragment for id ${id}`, error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
