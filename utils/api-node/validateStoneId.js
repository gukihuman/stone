// utils/api-node/validateStoneId.js
export default async function validateStoneId(stoneId) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const response = await fetch(`${baseUrl}/api-node/validate-stone-id`, {
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
    console.error("error in validateStoneId utility", error)
    return { success: false, message: error.message }
  }
}
