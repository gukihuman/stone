// ~/utils/api-node/dbAddCircleEntity.js
export default async function dbAddCircleEntity(entityName) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stoneId not found for dbAddCircleEntity")
    if (!entityName)
      throw new Error("entityName is required for dbAddCircleEntity")
    const body = { stoneId, entityName }
    const response = await fetch(`${baseUrl}/api-node/db-add-circle-entity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `http ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(
      `error in dbAddCircleEntity utility for '${entityName}'`,
      error
    )
    return { success: false, message: error.message }
  }
}
