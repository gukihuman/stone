// ~/utils/api-node/dbRemoveCircleEntity.js
export default async function dbRemoveCircleEntity(entityName) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stoneId not found for dbRemoveCircleEntity")
    if (!entityName)
      throw new Error("entityName is required for dbRemoveCircleEntity")
    const body = { stoneId, entityName }
    const response = await fetch(
      `${baseUrl}/api-node/db-remove-circle-entity`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `http ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(
      `error in dbRemoveCircleEntity utility for '${entityName}'`,
      error
    )
    return { success: false, circle: [], message: error.message }
  }
}
