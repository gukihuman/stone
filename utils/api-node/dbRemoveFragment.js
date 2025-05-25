// utils/api-node/dbRemoveFragment.js
export default async function dbRemoveFragment(fragmentId) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stone-id not found for dbRemoveFragment")
    const body = { fragmentId, stoneId }
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
    console.error(`error in dbRemoveFragment for id ${fragmentId}`, error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
