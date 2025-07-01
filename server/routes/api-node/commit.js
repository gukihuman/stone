// ~/server/routes/api-node/commit.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"
import parseLoom from "~/server/utils/parser"
import newId from "~/shared/utils/newId"

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
    const { loomContent, accessToken } = (await readBody(event)) || {}
    const secret = process.env.ACCESS_TOKEN

    if (!secret) {
      throw createError({
        statusCode: 500,
        statusMessage: "access token not configured on server",
      })
    }
    if (accessToken !== secret) {
      throw createError({
        statusCode: 403,
        statusMessage: "invalid access token",
      })
    }
    if (typeof loomContent !== "string" || loomContent.trim() === "") {
      throw createError({
        statusCode: 400,
        statusMessage: "invalid payload or empty loom content",
      })
    }

    const parsed = parseLoom(loomContent)

    if (parsed.waves && parsed.waves.length > 0) {
      const wavesToCreate = parsed.waves.map((wave) => ({
        ...wave,
        _id: newId(),
        timestamp: Date.now(),
      }))
      await Wave.insertMany(wavesToCreate)
    }

    return { success: true, message: "commit successful" }
  } catch (error) {
    console.error("error in /api-node/commit", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
