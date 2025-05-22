// utils/api-node/dbCreateFragment.js
export default async function dbCreateFragment(fragmentData) {
  const baseURL = useRuntimeConfig().public.baseUrl
  try {
    const response = await fetch(`${baseURL}/api-node/db-create-fragment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fragmentData),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage)
    }
    return await response.json()
  } catch (error) {
    console.error("client error in dbCreateFragment", error)
    return { success: false, message: error.message, errorDetails: error }
  }
}
