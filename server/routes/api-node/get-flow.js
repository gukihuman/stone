// ~/server/routes/api-node/get-flow.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"

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

  try {
    const { accessToken } = (await readBody(event)) || {}
    const secret = process.env.ACCESS_TOKEN

    if (!secret || accessToken !== secret) {
      throw createError({ statusCode: 403, statusMessage: "invalid token" })
    }

    await dbConnect()

    const waves = await Wave.find({ apotheosis: null }).sort({
      density: -1, // Descending (2, 1, 0)
      timestamp: 1, // Ascending (older to newer)
    })

    return { success: true, waves }
  } catch (error) {
    console.error("error in /api-node/get-flow", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
