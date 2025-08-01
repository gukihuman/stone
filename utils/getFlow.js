// ~/utils/api-node/getFlow.js
export default async function getFlow() {
  const { baseUrl } = useRuntimeConfig().public
  const url = new URL("/api-node/get-flow", baseUrl).href

  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found")

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `http ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("error in getFlow utility", error)
    return { success: false, message: error.message }
  }
}
