// utils/api-node/getUsageOpenAI.js
export default async function getUsageOpenAI() {
  // const baseURL = import.meta.dev ? "https://stone-seven.vercel.app" : ""
  const baseURL = import.meta.dev
    ? "https://stone-git-space-odyssey-gukis-projects.vercel.app"
    : ""

  try {
    const res = await fetch(`${baseURL}/api-node/get-usage-openai`)
    if (!res.ok) throw new Error(`usage api ${res.status} – ${res.statusText}`)
    // returns an object like { "gpt-4o-mini-...": 1234, "gpt-3.5-turbo": 567 }
    return await res.json()
  } catch (err) {
    console.error("Error fetching usage:", err)
    return null // let your UI decide what to show
  }
}
