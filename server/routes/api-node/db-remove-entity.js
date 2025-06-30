// server/routes/api-node/db-remove-entity.js
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
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed. Please use POST.",
    })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    const { entityId, stoneId } = body || {}

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
        statusMessage: "unauthorized access to remove entity",
      })
    }
    if (!entityId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required field: entityId",
      })
    }
    const result = await Entity.findByIdAndDelete(entityId)
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: `entity with id ${entityId} not found`,
      })
    }
    return {
      success: true,
      message: `entity with id ${entityId} removed successfully`,
    }
  } catch (error) {
    if (error.statusCode) throw error
    const idForLog =
      typeof body === "object" && body !== null && "entityId" in body
        ? body.entityId
        : "unknown"
    console.error(`error removing entity with id ${idForLog}`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `failed to remove entity ${error.message}`,
    })
  }
})
