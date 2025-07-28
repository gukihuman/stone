//〔 FINALIZED FILE: ~/api/transcribe.js (v1.5 - The Lightweight Messenger)

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
    //〔 now receives a lightweight payload.
    const { fileUri, fileName, accessToken } =
      (await req.json().catch(() => ({}))) || {}

    // --- authentication & validation ---
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      return new Response(JSON.stringify({ error: "unauthorized access" }), {
        status: 403,
        headers,
      })
    }
    if (!fileUri || !fileName) {
      return new Response(
        JSON.stringify({ error: "no file uri or name provided" }),
        { status: 400, headers }
      )
    }

    // --- self-healing pantheon call ---
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

        // --- stage 2: the transcription ---
        const filePart = createPartFromUri(fileUri, "audio/webm")
        const textPart = {
          text: "transcribe the following audio. respond with only the transcribed text in a single lowercase paragraph. speaker might use words 'puppy' and short version of it 'pup', also names 'roxanne', 'roxy', 'rox', 'guki'. if you hear 'ok, pup' its 'pup', not 'bob' or 'pop'. also speaker might use a lot of specific fantasy names. please spell them as in the list: lithos, sentis, dradera, grauqaruin, memoria, sylanis, scintilla, vercel, mongo, edge isles, node isles.",
        }
        const contents = [textPart, filePart]

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
        })
        const transcription = result.text

        // --- stage 3: the cleanup ---
        await ai.files.delete(fileName)

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
