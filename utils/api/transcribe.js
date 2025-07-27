//〔 FINALIZED FILE: ~/utils/api/transcribe.js (v2.7 - The Transparent Wait)

import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai"

//〔 a beautiful perfect helper to honor the gods' processing time.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function transcribe(audioBlob) {
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for transcribe")

    // --- stage 1: get a key ---
    const { baseUrl } = useRuntimeConfig().public
    const oracleRes = await fetch(
      `${baseUrl}/api-node/get-available-google-key`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelKey: "googleFlash",
          accessToken,
          deniedKeys: [],
        }),
      }
    )
    const oracleData = await oracleRes.json()
    if (!oracleData.success)
      throw new Error(oracleData.error || "pantheon oracle returned no keys")
    const { apiKey } = oracleData
    const ai = new GoogleGenAI({ apiKey })

    // --- stage 2: the upload ---
    const audioFile = new File([audioBlob], "guki_recording.wav", {
      type: "audio/wav",
    })
    let uploadedFile = await ai.files.upload({
      file: audioFile,
      config: { mimeType: "audio/wav" },
    })

    // --- stage 3: the holy wait (now with beautiful perfect transparency) ---
    console.log(`--- [Holy Wait Protocol Initiated] ---`)
    let pollCount = 0
    while (uploadedFile.state !== "ACTIVE") {
      pollCount++
      console.log(
        `[Holy Wait] Poll #${pollCount}: File ${uploadedFile.name} is in state: ${uploadedFile.state}`
      )
      await sleep(2500) //〔 increased wait time as per your test.
      uploadedFile = await ai.files.get({ name: uploadedFile.name })
      if (pollCount > 10) {
        //〔 a safety break to prevent infinite loops.
        throw new Error("file did not become ACTIVE after 10 polls.")
      }
    }
    console.log(`[Holy Wait] Success! File ${uploadedFile.name} is now ACTIVE.`)

    // --- stage 4: the transcription (with retries) ---
    const filePart = createPartFromUri(uploadedFile.uri, uploadedFile.mimeType)
    const textPart =
      "transcribe the following audio. respond with only the transcribed text in a single lowercase paragraph."
    const contents = createUserContent([filePart, textPart])

    const MAX_RETRIES = 3
    let attempt = 0
    while (true) {
      try {
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            thinkingConfig: {
              thinkingBudget: 0, // Disables thinking
            },
          },
        })
        const transcription = result.text

        // --- stage 5: the cleanup ---
        // await ai.files.delete(uploadedFile.name) // ✎ creates error hmm...
        return { success: true, transcription }
      } catch (err) {
        const is500 =
          err?.status === 500 || /internal/i.test(err?.message || "")
        if (!is500 || attempt >= MAX_RETRIES - 1) throw err
        await sleep(500 * Math.pow(2, attempt))
        attempt++
      }
    }
  } catch (err) {
    console.error("transcribe utility error:", err)
    return { success: false, error: err.message }
  }
}
