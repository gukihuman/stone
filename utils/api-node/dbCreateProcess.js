// ~/utils/api-node/dbCreateProcess.js
import { useCookie, useRuntimeConfig } from "#app"

export default async function dbCreateProcess(processData) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const processId = useCookie("process-id").value
    if (!processId) throw new Error("process-id not found for dbCreateProcess")

    const bodyToSend = { ...processData, processId }
    const response = await fetch(`${baseURL}/api-node/db-create-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyToSend),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error("client error in dbCreateProcess", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
