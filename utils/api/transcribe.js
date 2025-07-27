//〔 FINALIZED FILE: ~/utils/api/transcribe.js (The New Messenger)

export default async function transcribe(audioBlob) {
  //〔 now takes the raw blob.
  const { baseUrl } = useRuntimeConfig().public
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for transcribe")

    //〔 we now send FormData, not JSON.
    const formData = new FormData()
    formData.append("audioBlob", audioBlob)
    formData.append("accessToken", accessToken)

    const res = await fetch(`${baseUrl}/api/transcribe`, {
      method: "POST",
      body: formData, //〔 no 'Content-Type' header needed; the browser sets it.
    })

    if (!res.ok) {
      let msg = `HTTP ${res.status} – ${res.statusText}`
      try {
        const err = await res.json()
        msg = err?.error || err?.message || msg
      } catch (_) {}
      throw new Error(msg)
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error("transcribe utility error:", err)
    return { success: false, error: err.message }
  }
}
