//〔 FINALIZED FILE: ~/api/transcribe.js (v1.4 - The Two-Stage Alchemist)

import { GoogleGenAI, createPartFromUri } from "@google/genai"

export const config = { runtime: "edge" }

export default async function handler(req) {
  // --- boilerplate: cors & method check ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  }

  try {
    //〔 we now parse FormData instead of JSON.
    const formData = await req.formData()
    const audioBlob = formData.get("audioBlob")
    const accessToken = formData.get("accessToken")

    // --- authentication & validation ---
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
        headers,
      })
    }
    if (!audioBlob) {
      return new Response(JSON.stringify({ error: "no audio data provided" }), {
        status: 400,
        headers,
      })
    }

    // --- self-healing pantheon call (repurposed for the entire two-stage process) ---
    const MAX_RETRIES = 5
    const deniedKeys = []
    let lastError = null

    for (let i = 0; i < MAX_RETRIES; i++) {
      let keyIdForRetry
      try {
        const oracleRes = await fetch(
          new URL("/api-node/get-available-google-key", req.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelKey: "googleFlash",
              accessToken,
              deniedKeys,
            }),
          }
        )
        const oracleData = await oracleRes.json()
        if (!oracleData.success) {
          lastError = new Error(
            oracleData.error || "pantheon oracle returned no keys"
          )
          break
        }
        const { apiKey, keyId } = oracleData
        keyIdForRetry = keyId

        const ai = new GoogleGenAI({ apiKey })

        // --- stage 1: the upload ---
        const uploadedFile = await ai.files.upload({
          file: audioBlob,
          config: { mimeType: "audio/webm" },
        })

        // --- stage 2: the transcription ---
        const filePart = createPartFromUri(
          uploadedFile.uri,
          uploadedFile.mimeType
        )
        const textPart = {
          text: "transcribe the following audio. respond with only the transcribed text in a single lowercase paragraph.",
        }
        const contents = [textPart, filePart]

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
        })

        const transcription = result.text

        //〔 we should clean up the temporary file after we're done.
        await ai.files.delete(uploadedFile.name)

        return new Response(JSON.stringify({ success: true, transcription }), {
          status: 200,
          headers,
        })
      } catch (e) {
        console.error(
          `transcribe attempt ${i + 1} with key ${keyIdForRetry} failed:`,
          e.message
        )
        lastError = e
        if (keyIdForRetry) deniedKeys.push(keyIdForRetry)
      }
    }

    const finalError =
      lastError || new Error("all transcription retries failed")
    return new Response(JSON.stringify({ error: finalError.message }), {
      status: 500,
      headers,
    })
  } catch (error) {
    console.error("error in /api/transcribe handler:", error)
    return new Response(JSON.stringify({ error: "internal server error" }), {
      status: 500,
      headers,
    })
  }
}
