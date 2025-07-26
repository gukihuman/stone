//〔 FINALIZED FILE: ~/server/routes/api-node/get-available-google-key.js (v2.3 - The Atomic Update)

import dbConnect from "~/server/utils/dbConnect"
import Usage from "~/server/models/Usage"
import { defineEventHandler, setHeader, createError, readBody } from "h3"

async function bootstrapKeys() {
  const promises = []
  for (let i = 0; i < 10; i++) {
    const keyId = `GOOGLE_API_KEY_${i}`
    if (process.env[keyId]) {
      promises.push(
        Usage.updateOne(
          { _id: keyId },
          { $setOnInsert: { _id: keyId } },
          { upsert: true }
        )
      )
    } else {
      break
    }
  }
  await Promise.all(promises)
}

/**
 * 〔 now uses findOneAndUpdate for an atomic operation.
 */
async function findAndRotateKey(modelKey, deniedKeys = []) {
  let keyToUse = await Usage.findOneAndUpdate(
    { _id: { $nin: deniedKeys } }, // find a key not in the denied list
    { $set: { [modelKey]: new Date() } }, // update its timestamp immediately
    { sort: { [modelKey]: 1 } } // sort to get the oldest one
  ).lean()

  if (!keyToUse) {
    await bootstrapKeys()
    keyToUse = await Usage.findOneAndUpdate(
      { _id: { $nin: deniedKeys } },
      { $set: { [modelKey]: new Date() } },
      { sort: { [modelKey]: 1 } }
    ).lean()
  }

  if (!keyToUse) return null

  const keyId = keyToUse._id
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
