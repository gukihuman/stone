//〔 ~/server/utils/incrementUsage.js
//〔 diagnostic version 2.0

import Usage from "~/server/models/Usage"

export default async function incrementUsage(counterKey) {
  const todayUTC = new Date().toISOString().slice(0, 10)
  console.log(
    `[UsageTracker]: Initiating increment for key: ${counterKey} on date: ${todayUTC}`
  )

  try {
    const currentUsage = await Usage.findById("singleton_usage_document").lean()
    console.log("[UsageTracker]: Fetched current usage document:", currentUsage)

    if (currentUsage && currentUsage.date === todayUTC) {
      console.log("[UsageTracker]: Same day detected. Incrementing counter.")
      await Usage.updateOne(
        { _id: "singleton_usage_document" },
        { $inc: { [counterKey]: 1 } }
      )
      console.log("[UsageTracker]: Increment successful.")
    } else {
      console.log(
        "[UsageTracker]: New day or first run. Resetting all counters."
      )
      await Usage.updateOne(
        { _id: "singleton_usage_document" },
        {
          $set: {
            date: todayUTC,
            googleProRequests: 0,
            googleFlashRequests: 0,
            googleFlashLiteRequests: 0,
            googleFlashTtsRequests: 0,
            [counterKey]: 1,
          },
        },
        { upsert: true }
      )
      console.log("[UsageTracker]: Reset and first increment successful.")
    }
  } catch (error) {
    console.error("failed to increment usage counter:", error)
  }
}
