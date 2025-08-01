// 〔 ~/utils/api-node/commit.js
export default async function commit(loomContent) {
  const { baseUrl } = useRuntimeConfig().public
  const url = new URL("/api-node/commit", baseUrl).href

  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found")

    const bodyToSend = { loomContent, accessToken }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `http ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("error in commit utility", error)
    return { success: false, message: error.message }
  }
}
