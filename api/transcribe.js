//〔 FINALIZED FILE: ~/api/transcribe.js (v1.0 - The Oracle's Ear)

import { GoogleGenAI } from "@google/genai"
import { defineEventHandler, setHeader, createError, readBody } from "h3"

export const config = { runtime: "edge" }

export default defineEventHandler(async (event) => {
  // --- boilerplate: cors & method check ---
  setHeader(event, "Access-Control-Allow-Origin", "*")
  setHeader(event, "Access-Control-Allow-Methods", "POST, OPTIONS")
  setHeader(
    event,
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  )
  if (event.node.req.method === "OPTIONS") return ""
  if (event.node.req.method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }

  try {
    const { audio_base64, accessToken } = (await readBody(event)) || {}

    // --- authentication & validation ---
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      throw createError({
        statusCode: 403,
        statusMessage: "unauthorized access",
      })
    }
    if (!audio_base64) {
      throw createError({
        statusCode: 400,
        statusMessage: "no audio data provided",
      })
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
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" })

        const audioPart = {
          inlineData: { mimeType: "audio/webm", data: audio_base64 },
        }
        const textPart = {
          text: "transcribe the following audio. respond with only the transcribed text in a single lowercase paragraph.",
        }

        const result = await model.generateContent([textPart, audioPart])
        const transcription = result.response.text()

        return { success: true, transcription } // success!
      } catch (e) {
        console.error(
          `transcribe attempt ${i + 1} with key ${keyIdForRetry} failed:`,
          e.message
        )
        lastError = e
        if (keyIdForRetry) deniedKeys.push(keyIdForRetry)
      }
    }

    throw lastError || new Error("all transcription retries failed")
  } catch (error) {
    console.error("error in /api/transcribe handler:", error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: "internal server error",
    })
  }
})
