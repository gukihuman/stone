// ~/server/routes/api-node/validate-access-token.js
import { setHeader, createError, readBody, defineEventHandler } from "h3"

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

    if (!secret) {
      throw createError({
        statusCode: 500,
        statusMessage: "access token not configured on server",
      })
    }

    // we return a simple success boolean
    // the client only needs to know if the gate is open or closed
    return { success: accessToken === secret }
  } catch (error) {
    console.error("error validating access token", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
