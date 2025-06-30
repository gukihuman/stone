// ~/server/routes/api-node/db-get-circle.js
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
    if (!stoneId) {
      throw createError({
        statusCode: 400,
        statusMessage: "stoneId is required",
      })
    }
    const requestingEntity = await Entity.findById(stoneId).lean()
    if (!requestingEntity) {
      throw createError({
        statusCode: 404,
        statusMessage: `requesting entity with stoneId '${stoneId}' not found`,
      })
    }

    if (!requestingEntity.circle || requestingEntity.circle.length === 0) {
      return { success: true, circle: [] }
    }
    const circle = await Entity.find({
      name: { $in: requestingEntity.circle },
    })
      .select("name nature state -_id")
      .lean()
    return { success: true, circle }
  } catch (error) {
    console.error("error in db-get-circle", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
