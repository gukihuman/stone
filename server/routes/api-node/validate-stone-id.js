// ~/server/routes/api-node/validate-stone-id.js
import dbConnect from "~/server/utils/dbConnect"
import Entity from "~/server/models/Entity"
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
      statusMessage: "method not allowed",
    })
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
    const existingEntity = await Entity.findById(stoneId).lean()
    if (existingEntity) {
      return {
        success: true,
        message: "stoneId is valid",
        entityName: existingEntity.name,
      }
    } else {
      return { success: false, message: "stoneId not found" }
    }
  } catch (error) {
    console.error("error validating stoneId", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
