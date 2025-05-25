// ~/utils/api-node/dbGetMyName.js
export default async function dbGetMyName() {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stoneId not found for dbGetMyName")

    const response = await fetch(`${baseUrl}/api-node/db-get-my-name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stoneId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `http ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("error in dbGetMyName utility", error)
    return { success: false, name: null, message: error.message }
  }
}
