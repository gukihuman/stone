// server/routes/api-node/db-remove-fragment.js
import dbConnect from "~/server/utils/dbConnect"
import Fragment from "~/server/models/Fragment"
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
      statusMessage: "method not allowed please use POST",
    })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    const { fragmentId, stoneId } = body || {}

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
        statusMessage: "unauthorized access to remove fragment",
      })
    }
    if (!fragmentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "missing required field fragmentId",
      })
    }
    const result = await Fragment.findByIdAndDelete(fragmentId)
    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: `fragment with id '${fragmentId}' not found`,
      })
    }
    return {
      success: true,
      message: `fragment with id '${fragmentId}' removed successfully`,
    }
  } catch (error) {
    if (error.statusCode) throw error
    console.error(error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
