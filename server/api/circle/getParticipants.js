// server/api/circle/getParticipants.js
import dbConnect from "../../utils/dbConnect" // Adjust path if needed
import Participant from "../../models/Participant" // Adjust path if needed

export default defineEventHandler(async (event) => {
  await dbConnect()

  let participantIds
  try {
    // Expecting IDs in the body as { ids: ['id1', 'id2', ...] }
    const body = await readBody(event)
    participantIds = body?.ids
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      throw new Error(
        "Missing or invalid participant IDs array in request body."
      )
    }
    // Optional: Add validation to ensure IDs are strings etc.
  } catch (error) {
    console.error("Error reading getParticipants request body:", error)
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid request body. ${error.message}`,
    })
  }

  try {
    // Use $in operator to find all participants whose _id is in the provided array
    const participants = await Participant.find({
      _id: { $in: participantIds },
    }).lean() // Use .lean() for plain JS objects

    // Return only necessary fields - VERY IMPORTANT for security/privacy
    const participantsToReturn = participants.map((p) => ({
      _id: p._id,
      name: p.name, // Only return ID and Name
      // Do NOT return role or other sensitive info unless specifically needed by the client
    }))

    console.log(`Fetched data for ${participantsToReturn.length} participants.`)
    return participantsToReturn // Return the array of filtered participant objects
  } catch (error) {
    console.error("Error fetching participants:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "An error occurred while fetching participants.",
    })
  }
})
