//〔 ~/server/routes/api-node/get-available-google-key.js

import dbConnect from "~/server/utils/dbConnect"
import Usage from "~/server/models/Usage"
import { GOOGLE_LIMITS } from "~/server/constants"
import { defineEventHandler, setHeader, createError } from "h3"

//〔 this helper function is now a private part of this module.
function getPacificDate() {
  const today = new Date()
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(today)
    .replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2")
}

//〔 this core logic is also now a private part of this module.
async function findAndIncrementKey(modelKey) {
  const todayPacific = getPacificDate()
  const limit = GOOGLE_LIMITS[modelKey]

  if (!limit) {
    console.error(
      `[PantheonManager]: no limit defined for modelKey: ${modelKey}`
    )
    return null
  }

  for (let i = 0; i < 10; i++) {
    const envKeyName = `GOOGLE_API_KEY_${i}`
    const apiKey = process.env[envKeyName]

    if (!apiKey) break

    try {
      const currentUsage = await Usage.findById(envKeyName)

      if (!currentUsage || currentUsage.date !== todayPacific) {
        await Usage.updateOne(
          { _id: envKeyName },
          {
            $set: {
              date: todayPacific,
              googleProRequests: 0,
              googleFlashRequests: 0,
              googleFlashLiteRequests: 0,
              googleFlashTtsRequests: 0,
              [modelKey]: 1,
            },
          },
          { upsert: true }
        )
        return apiKey
      } else {
        if (currentUsage[modelKey] < limit) {
          await Usage.updateOne(
            { _id: envKeyName },
            { $inc: { [modelKey]: 1 } }
          )
          return apiKey
        }
      }
    } catch (error) {
      console.error(
        `[PantheonManager]: error processing key ${envKeyName}:`,
        error
      )
    }
  }

  console.warn(
    `[PantheonManager]: all google api keys have reached their quota for ${modelKey}`
  )
  return null
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Access-Control-Allow-Origin", "*")
  setHeader(event, "Access-Control-Allow-Methods", "POST, OPTIONS")
  setHeader(event, "Access-Control-Allow-Headers", "Content-Type")
  if (event.node.req.method === "OPTIONS") return ""
  if (event.node.req.method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }

  await dbConnect()

  try {
    const { modelKey, accessToken } = await readBody(event)

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

    const apiKey = await findAndIncrementKey(modelKey)

    if (apiKey) {
      return { success: true, apiKey }
    } else {
      return { success: false, error: "no available keys" }
    }
  } catch (error) {
    console.error("error in get-available-google-key handler:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "internal server error",
    })
  }
})
