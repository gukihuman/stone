import dbConnect from "../../utils/dbConnect"
import Participant from "../../models/Participant"

export default defineEventHandler(async (event) => {
  // 1. Ensure DB connection
  await dbConnect()

  // 2. Read the potential participant ID (invite code) from the request body
  let participantId
  try {
    const body = await readBody(event)
    participantId = body?._id // Assuming the client sends { _id: '...' }
    if (!participantId) {
      throw new Error("Participant ID (_id) is required in the request body.")
    }
  } catch (error) {
    console.error("Error reading request body:", error)
    throw createError({
      statusCode: 400, // Bad Request
      statusMessage: "Invalid request body. Expected JSON with _id field.",
    })
  }

  // 3. Find the participant in the database using the provided ID
  try {
    // findById is a Mongoose helper for querying by _id
    // .lean() returns a plain JS object
    const participant = await Participant.findById(participantId).lean()

    if (!participant) {
      // If no participant found with that ID
      console.log(`❗ Participant validation failed for ID: ${participantId}`)
      return { success: false, message: "Invalid participant ID." }
    }

    // If participant found, return success and relevant data
    console.log(
      `✅ Participant validated: ${participant.name || participant._id}`
    )
    return {
      success: true,
      // Only return necessary info to the client, not the whole DB document if sensitive
      participant: {
        _id: participant._id,
        name: participant.name,
        role: participant.role,
      },
    }
  } catch (error) {
    console.error(`Error validating participant ID ${participantId}:`, error)
    // Handle potential database errors
    throw createError({
      statusCode: 500, // Internal Server Error
      statusMessage: "An error occurred while validating the participant.",
    })
  }
})
