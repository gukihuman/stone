// server/routes/api-node/db-get-entities.js
import dbConnect from "~/server/utils/dbConnect"
import Entity from "~/server/models/Core"
import { setHeader, createError, readBody, defineEventHandler } from "h3"

export default defineEventHandler(async (event) => {
  setHeader(event, "Access-Control-Allow-Origin", "*")
  setHeader(event, "Access-Control-Allow-Methods", "POST, OPTIONS")
  setHeader(
    event,
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  )
  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
  if (event.node.req.method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    const { stoneId } = body || {}
    const rootIdFromEnv = process.env.ROOT_ID
    if (!rootIdFromEnv) {
      console.error("ROOT_ID environment variable is not set")
      throw createError({
        statusCode: 500,
        statusMessage: "server configuration error",
      })
    }
    if (!stoneId || stoneId !== rootIdFromEnv) {
      throw createError({
        statusCode: 403,
        statusMessage: "unauthorized access",
      })
    }
    const entities = await Entity.find({}).lean()
    return { success: true, entities: entities }
  } catch (error) {
    if (error.statusCode) throw error
    console.error("error in db-get-entities", error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to process request: ${error.message}`,
    })
  }
})
