// utils/api-node/dbGetFragments.ts
import type { FragmentFilters } from "~/types/fragments"

export default async function dbGetFragments(filters: FragmentFilters) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stone-id not found for dbGetFragments")

    const body = { filters, stoneId }
    const response = await fetch(`${baseURL}/api-node/db-get-fragments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error("client error in dbGetFragments", error)
    return {
      success: false,
      message: error.message,
      errorDetails: error,
    }
  }
}
