// ~/utils/api-node/migrateEvent.js
export default async function migrateEvent(eventObject) {
  const { baseUrl } = useRuntimeConfig().public
  const url = new URL("/api-node/migrate-event", baseUrl).href

  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found")

    const bodyToSend = { eventObject, accessToken }

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
    console.error("error in migrateEvent utility", error)
    return { success: false, message: error.message }
  }
}
