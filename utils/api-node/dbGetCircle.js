// ~/utils/api-node/dbGetCircle.js
export default async function dbGetCircle() {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stoneId not found for dbGetCircle")
    const response = await fetch(`${baseUrl}/api-node/db-get-circle`, {
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
    console.error("error in dbGetCircle utility", error)
    return { success: false, circleEntities: [], message: error.message }
  }
}
