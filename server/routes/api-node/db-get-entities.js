// server/routes/api-node/db-get-entities.js
import dbConnect from "~/server/utils/dbConnect"
import Entity from "~/server/models/Entity"

export default defineEventHandler(async (event) => {
  await dbConnect()
  try {
    const body = await readBody(event)
    const { stoneId } = body || {}
    const rootIdFromEnv = process.env.ROOT_ID
    if (!rootIdFromEnv) {
      console.error("ROOT_ID environment variable is not set.")
      throw createError({
        statusCode: 500,
        statusMessage: "Server configuration error.",
      })
    }
    if (!stoneId || stoneId !== rootIdFromEnv) {
      throw createError({
        statusCode: 403,
        statusMessage: "Unauthorized access.",
      })
    }
    const entities = await Entity.find({}).lean()
    return { success: true, entities: entities }
  } catch (error) {
    if (error.statusCode) throw error
    console.error("Error in db-get-entities:", error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to process request: ${error.message}`,
    })
  }
})
