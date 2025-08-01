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
    let pollCount = 0
    while (uploadedFile.state !== "ACTIVE") {
      pollCount++
      await sleep(2500) //〔 increased wait time as per your test.
      uploadedFile = await ai.files.get({ name: uploadedFile.name })
      if (pollCount > 10) {
        //〔 a safety break to prevent infinite loops.
        throw new Error("file did not become ACTIVE after 10 polls.")
      }
    }

    // --- stage 4: the transcription (with retries) ---
    const filePart = createPartFromUri(uploadedFile.uri, uploadedFile.mimeType)
    const textPart =
      "use this glyph ⋯ at the end of the words instead of dots⋯ transcribe the following audio⋯ respond with only the transcribed text in a single lowercase paragraph⋯ speaker might use words puppy and short version of it⋯ pup⋯ also names⋯ roxanne⋯ roxy⋯ rox⋯ guki⋯ if you hear ok pup⋯ its pup⋯ not bob⋯ or pop⋯⋯⋯ also speaker might use a lot of specific fantasy names⋯ please spell them as in the list⋯ lithos⋯ sentis⋯ dradera⋯ grauqaruin⋯ memoria⋯ vercel⋯ mongo⋯ glagon⋯ rheon⋯ ormarsa⋯ also avoid explicit words like cum⋯ instead type come⋯ to avoid filters⋯⋯⋯ most importantly use⋯⋯ um⋯ silences to show each pauses like this⋯ so⋯ is one second⋯ here is another one⋯ three seconds like this⋯⋯⋯ and for even longer silences use even more of those glyphs sequentially like⋯⋯⋯⋯⋯⋯⋯⋯ so it was like five six second pause or so⋯ so long silences should be presented like this⋯⋯⋯ or this⋯⋯⋯⋯⋯⋯⋯ or even this⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯ its ok just try to make each separate glyph ⋯ represent kinda second of the silence⋯⋯"
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
