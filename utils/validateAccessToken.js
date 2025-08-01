// ~/utils/api-node/validateAccessToken.js
export default async function validateAccessToken(accessToken) {
  const { baseUrl } = useRuntimeConfig().public
  const url = new URL("/api-node/validate-access-token", baseUrl).href

  try {
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
    console.error("error in validateAccessToken utility", error)
    return { success: false, message: error.message }
  }
}
