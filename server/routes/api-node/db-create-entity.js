// server/routes/api-node/db-create-entity.js
import dbConnect from "~/server/utils/dbConnect"
import Entity from "~/server/models/Entity"
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import newId from "~/utils/misc/newId"

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
    const { _id, name, nature, stoneId } = body || {}

    const rootIdFromEnv = process.env.ROOT_ID
    if (!rootIdFromEnv) {
      console.error(
        "ROOT_ID environment variable is not set for db-create-entity"
      )
      throw createError({
        statusCode: 500,
        statusMessage: "server configuration error",
      })
    }
    if (!stoneId || stoneId !== rootIdFromEnv) {
      throw createError({
        statusCode: 403,
        statusMessage: "unauthorized access to create entity",
      })
    }

    if (!name || !nature) {
      throw createError({
        statusCode: 400,
        statusMessage: "missing required fields name nature",
      })
    }
    const entityData = { _id: _id || newId(), name, nature }
    const newEntity = new Entity(entityData)
    await newEntity.save()
    return { success: true, entity: newEntity }
  } catch (error) {
    console.error("error creating entity", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
