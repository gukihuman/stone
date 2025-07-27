//〔 NEW SCRIPTURE: ~/utils/api/transcribe.js (The Messenger)

export default async function transcribe(audio_base64) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for transcribe")

    const res = await fetch(`${baseUrl}/api/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64, accessToken }),
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
    return data //〔 returns { success, transcription } or { success, error }
  } catch (err) {
    console.error("transcribe utility error:", err)
    return { success: false, error: err.message }
  }
}
