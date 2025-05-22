// utils/api-node/getUsageOpenAI.js
export default async function getUsageOpenAI() {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const res = await fetch(`${baseURL}/api-node/get-usage-openai`)
    if (!res.ok) throw new Error(`usage api ${res.status} ${res.statusText}`)
    // returns an object like { "gpt-4o-mini": 671, "gpt-4.5-preview": 567 }
    return await res.json()
  } catch (err) {
    console.error("Error fetching usage:", err)
    return null
  }
}
