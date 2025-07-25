//〔 NEW FILE: ~/server/routes/api-node/record-get.js

import { setHeader, createError, readBody, defineEventHandler } from "h3"
import dbConnect from "~/server/utils/dbConnect"
import Record from "~/server/models/Record"

export default defineEventHandler(async (event) => {
  // --- boilerplate: cors & method check ---
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

  try {
    // --- authentication ---
    const { params, accessToken } = (await readBody(event)) || {}
    const secret = process.env.ACCESS_TOKEN
    if (!secret || accessToken !== secret) {
      throw createError({
        statusCode: 403,
        statusMessage: "invalid access token",
      })
    }

    // --- validation ---
    const { name } = params || {}
    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: "record-get requires a -name parameter",
      })
    }

    // --- execution ---
    await dbConnect()
    const record = await Record.findOne({ name }).lean()

    // --- response formatting ---
    if (!record) {
      return {
        success: true,
        bodyLog: `〄 record not found: ${name}`,
      }
    }

    return {
      success: true,
      bodyLog: `〄 record starts: ${record.name}\n${record.data}\n〄 record ends: ${record.name}`,
    }
  } catch (error) {
    console.error("error in /api-node/record-get", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
