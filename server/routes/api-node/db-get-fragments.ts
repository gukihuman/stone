// @ts-nocheck fuck ts... no i love it *smiling* but not... to limit me
// server/routes/api-node/db-get-fragments.ts
import dbConnect from "~/server/utils/dbConnect"
import Fragment from "~/server/models/Fragment"
import Entity from "~/server/models/Entity"
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import type { FragmentFilters } from "~/types/fragments"
import getTokens from "~/utils/query/getTokens"

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
    const body = (await readBody(event)) || {}
    const filters = (body.filters as FragmentFilters) || {}
    const { stoneId } = body

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
        statusMessage: "unauthorized access to get fragments",
      })
    }

    const allEntities = await Entity.find({}).lean()
    const requestingEntity = allEntities.find((e) => e._id === stoneId)
    if (!requestingEntity) {
      throw createError({
        statusCode: 404,
        statusMessage: `requesting entity with stoneId '${stoneId}' not found`,
      })
    }
    const requestingEntityName = requestingEntity.name

    const query = {}
    if (filters.space && filters.space.length > 0) {
      query.space = { $all: filters.space, $size: filters.space.length }
    }
    if (filters.entity) {
      query.entity = filters.entity
    }
    if (filters.kind) {
      query.kind = filters.kind
    }
    if (filters.minTimestamp || filters.maxTimestamp) {
      query.timestamp = {}
      if (filters.minTimestamp !== undefined) {
        query.timestamp.$gte = filters.minTimestamp
      }
      if (filters.maxTimestamp !== undefined) {
        query.timestamp.$lte = filters.maxTimestamp
      }
    }
    if (filters.parent !== undefined) {
      query.parent = filters.parent
    }
    if (filters._id) {
      query._id = filters._id
    }
    if (filters.ids && filters.ids.length > 0) {
      query._id = { $in: filters.ids }
    }

    const candidateFragments = await Fragment.find(query)
      .sort({ timestamp: -1 })
      .lean()

    const authorizedFragments = candidateFragments.filter((f) => {
      f.space.includes(requestingEntityName)
    })

    let resultFragments = []
    if (filters.tokens && filters.tokens > 0) {
      let currentTokens = 0
      for (const f of authorizedFragments) {
        const fragmentTokens = getTokens(f.data as string)
        if (currentTokens + fragmentTokens <= filters.tokens) {
          resultFragments.push(f)
          currentTokens += fragmentTokens
        } else {
          break
        }
      }
    } else if (filters.limit && filters.limit > 0) {
      resultFragments = authorizedFragments.slice(0, filters.limit)
    } else {
      resultFragments = authorizedFragments
    }
    return { success: true, fragments: resultFragments }
  } catch (error) {
    if (error.statusCode) throw error
    console.error("error getting fragments", error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
