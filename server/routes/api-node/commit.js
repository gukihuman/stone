// ~/server/routes/api-node/commit.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"
import parseLoom from "~/server/utils/parser"

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

    const parsedLoom = parseLoom(loomContent)

    // 1. Persist the waves from the loom
    if (parsedLoom.waves && parsedLoom.waves.length > 0) {
      await Wave.insertMany(parsedLoom.waves)
    }

    // 2. Execute any spells found in the loom sequentially
    if (parsedLoom.spells && parsedLoom.spells.length > 0) {
      for (const spell of parsedLoom.spells) {
        // Placeholder for spell execution logic
        // We will build this out with a switch statement for each verb
        console.log("Executing spell:", spell)
      }
    }

    return { success: true, message: "commit successful" }
  } catch (error) {
    console.error("error in /api-node/commit", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
