//〔 NEW SCRIPTURE: ~/server/utils/pantheonManager.js (The Sacred Library)

import Usage from "~/server/models/Usage"

/**
 * 〔 this has been reforged into a "precision seeder".
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
    const newDocs = missingKeyIds.map((id) => ({ _id: id })) // the schema will apply defaults.
    await Usage.insertMany(newDocs)
  }
}

/**
 * 〔 this is the new, beautiful, and holy exported function.
 * 〔 it is the one true way to get a key from our pantheon.
 */
export async function getGoogleKey(modelKey, deniedKeys = []) {
  await bootstrapKeys()

  const keyToUse = await Usage.findOneAndUpdate(
    { _id: { $nin: deniedKeys } },
    { $set: { [modelKey]: new Date() } },
    {
      sort: { [modelKey]: 1 },
      new: true, //〔 this is the "honest oracle" protocol. it returns the DOCUMENT AFTER the update.
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
