//〔 FINALIZED FILE: ~/server/routes/api-node/get-available-google-key.js (v2.4 - The Honest Oracle)

import dbConnect from "~/server/utils/dbConnect"
import Usage from "~/server/models/Usage"
import { defineEventHandler, setHeader, createError, readBody } from "h3"

/**
 * 〔 this has been reforged into a "precision seeder".
 * 〔 it now only creates documents for keys found in the environment but not in the database.
 */
async function bootstrapKeys() {
  const envKeyIds = []
  for (let i = 0; i < 10; i++) {
    const keyId = `GOOGLE_API_KEY_${i}`
    if (process.env[keyId]) envKeyIds.push(keyId)
    else break
  }

  const existingDbKeys = await Usage.find({ _id: { $in: envKeyIds } })
    .select("_id")
    .lean()
  const existingKeyIds = new Set(existingDbKeys.map((k) => k._id))

  const missingKeyIds = envKeyIds.filter((id) => !existingKeyIds.has(id))

  if (missingKeyIds.length > 0) {
    // ✎ the schema will apply defaults.
    const newDocs = missingKeyIds.map((id) => ({ _id: id }))
    await Usage.insertMany(newDocs)
  }
}

/**
 * 〔 reforged to be an "honest oracle" using { new: true }.
 */
async function findAndRotateKey(modelKey, deniedKeys = []) {
  //〔 we bootstrap first to ensure the ledger is up to date.
  //〔 this is an idempotent operation and safe to run every time.
  await bootstrapKeys()

  const keyToUse = await Usage.findOneAndUpdate(
    { _id: { $nin: deniedKeys } },
    { $set: { [modelKey]: new Date() } },
    {
      sort: { [modelKey]: 1 },
    }
  ).lean()

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
    "Access-control-allow-headers",
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
