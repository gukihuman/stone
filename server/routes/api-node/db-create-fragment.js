// server/routes/api-node/db-create-fragment.js
import dbConnect from "~/server/utils/dbConnect"
import Fragment from "~/server/models/Fragment"
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
      statusMessage: "method not allowed, please use POST",
    })
  }
  await dbConnect()
  try {
    const body = await readBody(event)
    if (
      !body ||
      !body.entity ||
      !Array.isArray(body.space) ||
      typeof body.data === "undefined"
    ) {
      throw createError({ statusCode: 400, statusMessage: "missing fields" })
    }

    const allEntities = await Entity.find({}).lean()
    const existingEntityNames = allEntities.map((e) => e.name)

    if (!existingEntityNames.includes(body.entity)) {
      throw createError({
        statusCode: 400,
        statusMessage: `creator entity '${body.entity}' not found`,
      })
    }

    if (body.space.length > 0) {
      const uniqueSpaceEntities = new Set(body.space)
      if (uniqueSpaceEntities.size !== body.space.length) {
        throw createError({
          statusCode: 400,
          statusMessage: "space cannot contain duplicate entity names",
        })
      }
      for (const spaceEntityName of body.space) {
        if (!existingEntityNames.includes(spaceEntityName)) {
          throw createError({
            statusCode: 400,
            statusMessage: `entity '${spaceEntityName}' in space not found`,
          })
        }
      }
    }

    const fragmentData = {
      _id: newId(),
      entity: body.entity,
      space: body.space,
      data: body.data,
      timestamp: Date.now(),
      parent: body.parent || null,
    }
    const newFragment = new Fragment(fragmentData)
    await newFragment.save()
    return { success: true, fragment: newFragment }
  } catch (error) {
    if (error.statusCode) throw error
    console.error(error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
