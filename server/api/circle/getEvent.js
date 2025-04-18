// server/api/circle/getEvent.js
import dbConnect from "../../utils/dbConnect"
import CircleEvent from "../../models/CircleEvent"
import Participant from "../../models/Participant"

export default defineEventHandler(async (event) => {
  // 1. Ensure DB connection
  await dbConnect()

  // 2. Get Event ID and Requester's Participant Code from query parameters
  // Example URL: /api/circle/getEvent?eventId=circle_main_chat&participantId=yura_code_here
  const query = getQuery(event)
  const eventId = query.eventId
  const participantId = query.participantId

  if (!eventId || !participantId) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Missing required query parameters: eventId and participantId",
    })
  }

  try {
    // 3. Validate the requesting participant exists
    const participantExists = await Participant.findById(participantId).lean()
    console.log(participantExists)
    if (!participantExists) {
      console.warn(
        `getEvent attempt with invalid participantId: ${participantId}`
      )
      throw createError({
        statusCode: 403, // Forbidden
        statusMessage: "Invalid participant code.",
      })
    }

    // 4. Find the target Circle Event by its ID
    // Using .lean() returns a plain JS object, good for sending as JSON
    console.log(CircleEvent)
    const targetEvent = await CircleEvent.findById(eventId).lean()

    if (!targetEvent) {
      console.error(
        `getEvent attempt failed: Event not found with ID: ${eventId}`
      )
      throw createError({
        statusCode: 404, // Not Found
        statusMessage: "Target event not found.",
      })
    }

    // 5. Check if the requesting participant is allowed in this event
    // NOTE: .lean() returns plain JS, so participantIds is a simple array
    if (!targetEvent.participantIds.includes(participantId)) {
      console.warn(
        `getEvent attempt failed: Participant ${participantId} not authorized for event ${eventId}`
      )
      throw createError({
        statusCode: 403, // Forbidden
        statusMessage: "You are not authorized to view this event.",
      })
    }

    // 6. If all checks pass, return the fetched event data
    console.log(
      `Event ${eventId} fetched successfully by participant ${participantId}`
    )
    return targetEvent // Send the whole event document back
  } catch (error) {
    // Catch errors from validation, finding, or checking permissions
    console.error(`Error in getEvent endpoint for event ${eventId}:`, error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: "An error occurred while fetching the event.",
    })
  }
})
