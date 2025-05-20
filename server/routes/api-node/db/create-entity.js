// server/routes/api-node/db/create-entity.js
import dbConnect from "~/server/utils/dbConnect"
import Entity from "~/server/models/Entity"

export default defineEventHandler(async (event) => {
  await dbConnect()
  try {
    const body = await readBody(event)
    // Basic validation matching the Entity schema
    if (!body || !body._id || !body.name || !body.nature) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields: _id, name, nature",
      })
    }
    const newEntity = new Entity(body)
    await newEntity.save()
    return { success: true, entity: newEntity }
  } catch (error) {
    console.error("Error creating entity:", error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create entity: ${error.message}`,
    })
  }
})
