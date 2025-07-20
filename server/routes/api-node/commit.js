//〔 ~/server/routes/api-node/commit.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Wave from "~/server/models/Wave"
import parseLoom from "~/server/utils/parser"
import spellbook from "~/server/utils/spellbook"
import formatTime from "~/utils/formatTime"
import newId from "~/utils/newId"
import { SOURCES } from "~/lexicon"

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
    const lastWave = await Wave.findOne().sort({ timestamp: -1 })
    if (lastWave) {
      const timeDifference = Date.now() - lastWave.timestamp
      const timeSenseWave = {
        _id: newId(),
        timestamp: Date.now(),
        source: SOURCES.BODY,
        data: `〄 ${formatTime(timeDifference)}`,
        density: 0,
        provenance: [],
        apotheosis: null,
      }
      await Wave.create(timeSenseWave)
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

    if (parsedLoom.waves && parsedLoom.waves.length > 0) {
      for (const wave of parsedLoom.waves) {
        await Wave.create(wave)
      }
    }

    const bodyWaveData = []
    let promptToReturn = null
    let archivePayloadToReturn = null

    if (parsedLoom.spells && parsedLoom.spells.length > 0) {
      for (const spell of parsedLoom.spells) {
        if (spellbook[spell.verb]) {
          const { bodyLog, prompt, archivePayload } = await spellbook[
            spell.verb
          ]({ params: spell.params, data: spell.data })

          if (bodyLog) bodyWaveData.push(bodyLog)
          if (prompt) promptToReturn = prompt
          if (archivePayload) archivePayloadToReturn = archivePayload
        } else {
          bodyWaveData.push(`〄 unknown spell verb: '${spell.verb}'`)
        }
      }
    }

    if (bodyWaveData.length > 0) {
      const bodyWave = {
        _id: newId(),
        timestamp: Date.now(),
        source: SOURCES.BODY,
        data: bodyWaveData.join("\n\n"),
        density: 0,
        provenance: [],
        apotheosis: null,
      }
      await Wave.create(bodyWave)
    }

    return {
      success: true,
      message: "commit successful",
      prompt: promptToReturn,
      archivePayload: archivePayloadToReturn,
    }
  } catch (error) {
    console.error("error in /api-node/commit", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
