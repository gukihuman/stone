// server/routes/api-node/db-create-entity.js
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
      statusMessage: "Method Not Allowed",
    })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    if (!body || !body._id || !body.name || !body.nature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields: _id, name, nature",
      })
    }
    const newEntity = new Entity(body)
    await newEntity.save()
    return { success: true, entity: newEntity }
  } catch (error) {
    console.error("Error creating entity:", error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create entity: ${error.message}`,
    })
  }
})
