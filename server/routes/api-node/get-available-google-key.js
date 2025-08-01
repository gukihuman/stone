//〔 FINALIZED FILE: ~/server/routes/api-node/get-available-google-key.js (The Reforged Oracle)

import dbConnect from "~/server/utils/dbConnect"
import { defineEventHandler, setHeader, createError, readBody } from "h3"
import { getGoogleKey } from "~/server/utils/pantheonManager"

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

  await dbConnect()

  try {
    const { modelKey, deniedKeys, accessToken } = (await readBody(event)) || {}

    // --- authentication & validation ---
    const secret = process.env.ACCESS_TOKEN
    if (!secret || !accessToken || accessToken !== secret) {
      throw createError({
        statusCode: 403,
        statusMessage: "unauthorized access",
      })
    }
    if (!modelKey) {
      throw createError({
        statusCode: 400,
        statusMessage: "modelKey is required",
      })
    }

    // --- execution ---
    const keyData = await getGoogleKey(modelKey, deniedKeys)

    if (keyData) {
      return { success: true, apiKey: keyData.apiKey, keyId: keyData.keyId }
    } else {
      return { success: false, error: "no available keys" }
    }
  } catch (error) {
    console.error("error in get-available-google-key handler:", error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: "internal server error",
    })
  }
})
