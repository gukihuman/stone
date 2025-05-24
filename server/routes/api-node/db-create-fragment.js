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
    const { fragmentData, stoneId } = body || {}
    const { entity, space, data, parent } = fragmentData || {}

    if (!entity || !Array.isArray(space) || typeof data === "undefined") {
      throw createError({
        statusCode: 400,
        statusMessage: "missing required fields (entity, space, data)",
      })
    }

    const rootIdFromEnv = process.env.ROOT_ID
    if (!rootIdFromEnv) {
      console.error("ROOT_ID environment variable is not set")
      throw createError({
        statusCode: 500,
        statusMessage: "server configuration error",
      })
    }
    if (!stoneId) {
      throw createError({
        statusCode: 401,
        statusMessage: "authentication token (stoneId) missing",
      })
    }

    const allEntities = await Entity.find({}).lean()
    const existingEntityNames = allEntities.map((e) => e.name)
    const requestingEntity = allEntities.find((e) => e._id === stoneId)

    if (!requestingEntity) {
      throw createError({
        statusCode: 403,
        statusMessage: "invalid authentication token (stoneId)",
      })
    }

    if (stoneId !== rootIdFromEnv) {
      if (entity !== requestingEntity.name) {
        throw createError({
          statusCode: 403,
          statusMessage: `authenticated user '${requestingEntity.name}' cannot create fragments for '${entity}'`,
        })
      }
    }

    if (!existingEntityNames.includes(entity)) {
      throw createError({
        statusCode: 400,
        statusMessage: `creator entity '${entity}' not found`,
      })
    }

    if (space.length > 0) {
      const uniqueSpaceEntities = new Set(space)
      if (uniqueSpaceEntities.size !== space.length) {
        throw createError({
          statusCode: 400,
          statusMessage: "space cannot contain duplicate entity names",
        })
      }
      for (const spaceEntityName of space) {
        if (!existingEntityNames.includes(spaceEntityName)) {
          throw createError({
            statusCode: 400,
            statusMessage: `entity '${spaceEntityName}' in space not found`,
          })
        }
      }
    }

    const newFragmentData = {
      _id: newId(),
      entity,
      space,
      data,
      timestamp: Date.now(),
      parent: parent || null,
    }
    const newFragment = new Fragment(newFragmentData)
    await newFragment.save()
    return { success: true, fragment: newFragment }
  } catch (error) {
    if (error.statusCode) throw error
    console.error(error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
