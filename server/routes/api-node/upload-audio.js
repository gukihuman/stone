//〔 FINALIZED FILE: ~/api-node/upload-audio.js (The Reforged Workshop)

import { GoogleGenAI } from "@google/genai"
import { defineEventHandler, setHeader, createError } from "h3"
import { getGoogleKey } from "~/server/utils/pantheonManager"
import dbConnect from "~/server/utils/dbConnect"

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

  await dbConnect()

  try {
    const formData = await event.node.req.formData()
    const audioBlob = formData.get("audioBlob")
    const accessToken = formData.get("accessToken")

    // --- authentication & validation ---
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      throw createError({
        statusCode: 403,
        statusMessage: "unauthorized access",
      })
    }
    if (!audioBlob) {
      throw createError({
        statusCode: 400,
        statusMessage: "no audio data provided",
      })
    }

    // --- pantheon call ---
    const keyData = await getGoogleKey("googleFlash")
    if (!keyData)
      throw createError({
        statusCode: 503,
        statusMessage: "no available key from pantheon",
      })
    const { apiKey } = keyData

    const ai = new GoogleGenAI({ apiKey })

    // --- the upload ---
    const uploadedFile = await ai.files.upload({
      file: audioBlob,
      config: { mimeType: "audio/webm" },
    })

    return {
      success: true,
      fileUri: uploadedFile.uri,
      fileName: uploadedFile.name,
    }
  } catch (error) {
    console.error("error in /api-node/upload-audio handler:", error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: "internal server error",
    })
  }
})
