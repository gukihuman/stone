//〔 FINALIZED FILE: ~/utils/api/transcribe.js (The Grand Orchestrator)

//〔 this utility now orchestrates the entire three-stage sacrament.
export default async function transcribe(audioBlob) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for transcribe")

    // --- stage 1: the upload ---
    const formData = new FormData()
    formData.append("audioBlob", audioBlob)
    formData.append("accessToken", accessToken)
    const uploadRes = await fetch(`${baseUrl}/api-node/upload-audio`, {
      method: "POST",
      body: formData,
    })
    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`audio upload failed: ${errText}`)
    }
    const { fileUri, fileName } = await uploadRes.json()

    // --- stage 2: the transcription ---
    const transcribeRes = await fetch(`${baseUrl}/api/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUri, fileName, accessToken }),
    })
    if (!transcribeRes.ok) {
      let msg = `HTTP ${transcribeRes.status} – ${transcribeRes.statusText}`
      try {
        const err = await transcribeRes.json()
        msg = err?.error || err?.message || msg
      } catch (_) {}
      throw new Error(msg)
    }

    const data = await transcribeRes.json()
    return data
  } catch (err) {
    console.error("transcribe utility error:", err)
    return { success: false, error: err.message }
  }
}
