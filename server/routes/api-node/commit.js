// ~/server/routes/api-node/commit.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"
import { SOURCES } from "~/shared/lexicon"
import parseLoom from "~/server/utils/parser"
import spellbook from "~/server/utils/spellbook"
import newId from "~/shared/utils/newId"

export default defineEventHandler(async (event) => {
  // ... (CORS and method checks remain the same) ...
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
    // initial body logic, only time sense here, for now [humorous amusement]
    const lastWave = await Wave.findOne().sort({ timestamp: -1 })
    if (lastWave) {
      const timeDiff = Date.now() - lastWave.timestamp
      // const THRESHOLD = 5 * 60 * 1000 // 5 minutes
      const THRESHOLD = 0

      if (timeDiff > THRESHOLD) {
        const timeSenseWave = {
          _id: newId(),
          timestamp: Date.now(),
          source: SOURCES.BODY,
          data: `[sense time: ${formatTimeDiff(timeDiff)} have passed]`,
          density: 0,
          provenance: [],
          apotheosis: null,
        }
        await Wave.create(timeSenseWave)
      }
    }

    const { loomContent, accessToken } = (await readBody(event)) || {}
    const secret = process.env.ACCESS_TOKEN
    if (!secret)
      throw createError({
        statusCode: 500,
        statusMessage: "access token not configured on server",
      })
    if (accessToken !== secret)
      throw createError({
        statusCode: 403,
        statusMessage: "invalid access token",
      })
    if (typeof loomContent !== "string" || loomContent.trim() === "") {
      throw createError({
        statusCode: 400,
        statusMessage: "invalid payload or empty loom content",
      })
    }

    const parsedLoom = parseLoom(loomContent)

    // 1. Persist the waves from the loom sequentially
    if (parsedLoom.waves && parsedLoom.waves.length > 0) {
      for (const wave of parsedLoom.waves) {
        await Wave.create(wave)
      }
    }

    // 2. Execute spells and collect feedback
    const bodyFeedback = []
    if (parsedLoom.spells && parsedLoom.spells.length > 0) {
      for (const spell of parsedLoom.spells) {
        if (spellbook[spell.verb]) {
          const feedback = await spellbook[spell.verb](spell.params, spell.data)
          bodyFeedback.push(feedback)
        } else {
          bodyFeedback.push(`[unknown spell verb: '${spell.verb}']`)
        }
      }
    }

    // 3. Create a single, consolidated Body wave if there's feedback from spells
    if (bodyFeedback.length > 0) {
      const bodyWave = {
        _id: newId(),
        timestamp: Date.now(),
        source: SOURCES.BODY,
        data: bodyFeedback.join("\n"),
        density: 0,
        provenance: [],
        apotheosis: null,
      }
      await Wave.create(bodyWave)
    }

    return { success: true, message: "commit successful" }
  } catch (error) {
    console.error("error in /api-node/commit", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})

// A clean helper function to format milliseconds into a readable string
function formatTimeDiff(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`
  return `${seconds} second${seconds > 1 ? "s" : ""}`
}
