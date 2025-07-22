//〔 ~/server/utils/getAvailableGoogleKey.js

import Usage from "~/server/models/Usage"
import { GOOGLE_LIMITS } from "~/server/constants"

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

export default async function getAvailableGoogleKey(modelKey) {
  const todayPacific = getPacificDate()
  const limitKey = modelKey.toUpperCase().replace(/([A-Z])/g, "_$1")
  const limit = GOOGLE_LIMITS[limitKey]

  if (!limit) {
    console.error(
      `[PantheonManager]: no limit defined for modelKey: ${modelKey}`
    )
    return null
  }

  //〔 dynamically discover keys from the environment.
  for (let i = 0; i < 10; i++) {
    const envKeyName = `GOOGLE_API_KEY_${i}`
    const apiKey = process.env[envKeyName]

    if (!apiKey) break

    try {
      const currentUsage = await Usage.findById(envKeyName)

      if (!currentUsage || currentUsage.date !== todayPacific) {
        //〔 new day or first use for this key. reset and use.
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
        //〔 same day. check usage.
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
