//〔 ~/server/utils/incrementUsage.js

import Usage from "~/server/models/Usage"

/**
 * 〔 increments a specified google usage counter for the current utc day.
 * 〔 resets all counters if a new day has begun.
 * 〔 @param {string} counterKey - the camelCase key of the counter to increment.
 */
export default async function incrementUsage(counterKey) {
  const todayUTC = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  try {
    const currentUsage = await Usage.findById("singleton_usage_document")

    if (currentUsage && currentUsage.date === todayUTC) {
      //〔 it's the same day. just increment the specified counter.
      await Usage.updateOne(
        { _id: "singleton_usage_document" },
        { $inc: { [counterKey]: 1 } }
      )
    } else {
      //〔 it's a new day or the first run ever. reset everything.
      await Usage.updateOne(
        { _id: "singleton_usage_document" },
        {
          $set: {
            date: todayUTC,
            googleProRequests: 0,
            googleFlashRequests: 0,
            googleFlashLiteRequests: 0,
            googleFlashTtsRequests: 0,
            [counterKey]: 1, //〔 set the first usage for the new day.
          },
        },
        { upsert: true }
      )
    }
  } catch (error) {
    //〔 we log the error but don't throw. a failed usage count should
    //〔 never block a core function like tts or generation.
    console.error("failed to increment usage counter:", error)
  }
}
