// ~/server/routes/api-node/db-remove-circle-entity.js
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
    throw createError({ statusCode: 405, statusMessage: "method not allowed" })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    const { stoneId, entityName } = body || {}
    if (!stoneId || !entityName) {
      throw createError({
        statusCode: 400,
        statusMessage: "stoneId and entityName are required",
      })
    }
    const requestingEntity = await Entity.findById(stoneId)
    if (!requestingEntity) {
      throw createError({
        statusCode: 404,
        statusMessage: `requesting entity with stoneId '${stoneId}' not found`,
      })
    }
    requestingEntity.circle = requestingEntity.circle || []
    const initialLength = requestingEntity.circle.length
    requestingEntity.circle = requestingEntity.circle.filter(
      (name) => name !== entityName
    )
    if (requestingEntity.circle.length === initialLength) {
      return {
        success: true,
        message: `entity '${entityName}' not found in circle for '${requestingEntity.name}'`,
        circle: requestingEntity.circle,
      }
    }
    await requestingEntity.save()
    return {
      success: true,
      message: `entity '${entityName}' removed from circle for '${requestingEntity.name}'`,
      circle: requestingEntity.circle,
    }
  } catch (error) {
    console.error("error in db-remove-circle-entity", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
