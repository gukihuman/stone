// utils/api-node/validateStoneId.js
export default async function validateStoneId(stoneId) {
  const { baseUrl } = useRuntimeConfig().public
  const url = new URL("/api-node/validate-stone-id", baseUrl).href
  console.log(url)
  try {
    const response = await fetch(url, {
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
