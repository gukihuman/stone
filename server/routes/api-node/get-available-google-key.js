//〔 FINALIZED FILE: ~/server/routes/api-node/get-available-google-key.js (v2.1 - The Named Key)

import dbConnect from "~/server/utils/dbConnect"
import Usage from "~/server/models/Usage"
import { defineEventHandler, setHeader, createError, readBody } from "h3"

/**
 * 〔 now returns an object { apiKey, keyId } or null.
 */
async function findAndRotateKey(modelKey, deniedKeys = []) {
  const keyToUse = await Usage.findOne({ _id: { $nin: deniedKeys } })
    .sort({ [modelKey]: 1 })
    .lean()

  if (!keyToUse) return null

  const keyId = keyToUse._id

  await Usage.updateOne({ _id: keyId }, { $set: { [modelKey]: new Date() } })

  const apiKey = process.env[keyId]
  if (!apiKey) {
    console.warn(
      `[PantheonManager]: key found in db (${keyId}) but not in env.`
    )
    return null
  }

  return { apiKey, keyId }
}

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
    const keyData = await findAndRotateKey(modelKey, deniedKeys)

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
