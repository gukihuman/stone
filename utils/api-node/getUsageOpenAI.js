// utils/api-node/getUsageOpenAI.js
export default async function getUsageOpenAI() {
  // const baseURL = import.meta.dev ? "https://stone-seven.vercel.app" : ""
  const baseURL = import.meta.dev
    ? "https://stone-git-space-odyssey-gukis-projects.vercel.app"
    : ""

  try {
    const res = await fetch(`${baseURL}/api-node/getUsageOpenAI`)
    if (!res.ok) throw new Error(`api failed ${res.status} – ${res.statusText}`)
    const { totalTokens } = await res.json()
    return totalTokens // plain number for ui
  } catch (err) {
    console.error("Error fetching usage:", err)
    return null // let ui decide what to do
  }
}
