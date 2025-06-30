// ~/server/routes/api-node/db-add-circle-entity.js
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
    const entityToAddExists = await Entity.findOne({
      name: entityName,
    }).lean()
    if (!entityToAddExists) {
      throw createError({
        statusCode: 404,
        statusMessage: `entity with name '${entityName}' not found`,
      })
    }
    if (requestingEntity.name === entityName) {
      throw createError({
        statusCode: 400,
        statusMessage: "cannot add self to own circle",
      })
    }
    requestingEntity.circle = requestingEntity.circle || []
    if (requestingEntity.circle.includes(entityName)) {
      return {
        success: true,
        message: `entity '${entityName}' already in circle for '${requestingEntity.name}'`,
        circle: requestingEntity.circle,
      }
    }
    requestingEntity.circle.push(entityName)
    await requestingEntity.save()
    return {
      success: true,
      message: `entity '${entityName}' added to circle for '${requestingEntity.name}'`,
      circle: requestingEntity.circle,
    }
  } catch (error) {
    console.error("error in db-add-circle-entity", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
