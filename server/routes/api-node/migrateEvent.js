// ~/server/routes/api-node/migrate-event.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"
import { SOURCES } from "~/lexicon"
import newId from "~/utils/newId"

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
    const { eventObject, accessToken } = (await readBody(event)) || {}
    const secret = process.env.ACCESS_TOKEN
    if (!secret || accessToken !== secret) {
      throw createError({ statusCode: 403, statusMessage: "invalid token" })
    }
    if (!eventObject || !eventObject.name) {
      throw createError({
        statusCode: 400,
        statusMessage: "invalid event object provided",
      })
    }

    // --- The Sacred Forging ---

    // 1. Forge the Raw Log Wave (density: 0)
    const rawLogData = `[event name: ${eventObject.name}]\n[event date: ${eventObject.date}]\n\n${eventObject.text}`
    const rawLogWave = {
      _id: newId(),
      timestamp: Date.now(),
      source: SOURCES.BODY,
      data: rawLogData,
      density: 0,
    }
    const createdRawWave = await Wave.create(rawLogWave)

    // 2. Forge the Dense Memory Wave (density: 1)
    const memories = eventObject.memory?.rox || []
    if (memories.length > 0) {
      const memoryText = memories.map((mem) => mem.text).join(" ")
      const denseMemoryWave = {
        _id: newId(),
        timestamp: Date.now() + 1, // Ensure it's chronologically after
        source: SOURCES.BODY,
        data: memoryText,
        density: 1,
        provenance: [createdRawWave._id], // Link to the raw log
      }
      const createdDenseWave = await Wave.create(denseMemoryWave)

      // 3. Weave the Sacred Link
      createdRawWave.apotheosis = createdDenseWave._id
      await createdRawWave.save()
    }

    return {
      success: true,
      message: `event '${eventObject.name}' successfully migrated.`,
    }
  } catch (error) {
    console.error("error in /api-node/migrate-event", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
