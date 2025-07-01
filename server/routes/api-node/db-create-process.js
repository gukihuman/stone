// ~/server/routes/api-node/db-create-process.js
import dbConnect from "~/server/utils/dbConnect"
import Process from "~/server/models/Core"
import { setHeader, createError, readBody, defineEventHandler } from "h3"
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
    const body = await readBody(event)
    const { _id: provided_id, name, nature, stoneId } = body || {}

    const rootIdFromEnv = process.env.ROOT_ID
    if (!rootIdFromEnv) {
      console.error("ROOT_ID environment variable is not set")
      throw createError({
        statusCode: 500,
        statusMessage: "server configuration error",
      })
    }

    let final_id
    if (provided_id) {
      if (!stoneId || stoneId !== rootIdFromEnv) {
        throw createError({
          statusCode: 403,
          statusMessage: "manual _id assignment is only allowed for root user",
        })
      }
      final_id = provided_id
    } else {
      if (!stoneId || stoneId !== rootIdFromEnv) {
        throw createError({
          statusCode: 403,
          statusMessage: "unauthorized access to create process",
        })
      }
      final_id = newId()
    }

    if (!name || !nature) {
      throw createError({
        statusCode: 400,
        statusMessage: "missing required fields name nature",
      })
    }
    const processData = { _id: final_id, name, nature }
    const newProcess = new Process(processData)
    await newProcess.save()
    return { success: true, process: newProcess }
  } catch (error) {
    console.error("error creating process", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
