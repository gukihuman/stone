import dbConnect from "../../utils/dbConnect"
import CircleEvent from "../../models/CircleEvent"
import Participant from "../../models/Participant"

export default defineEventHandler(async (event) => {
  // 1. Ensure DB connection
  await dbConnect()

  // 2. Read data from the request body
  let requestData
  try {
    requestData = await readBody(event)
    // Expecting: { eventId: 'circle_main_chat', participantId: 'user_id', text: 'message text' }
    // Note: We assume the client knows the participantId (_id) it's posting *as*.
    // For AI posts, the client would send the AI's ID ('echo_id').
    if (
      !requestData ||
      !requestData.eventId ||
      !requestData.participantId ||
      !requestData.text
    ) {
      throw new Error("Missing required fields: eventId, participantId, text")
    }
  } catch (error) {
    console.error("Error reading postMessage request body:", error)
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid request body. ${error.message}`,
    })
  }

  const { eventId, participantId, text } = requestData

  try {
    // 3. Validate the participant actually exists (basic security check)
    const participantExists = await Participant.findById(participantId).lean()
    if (!participantExists) {
      console.warn(
        `postMessage attempt with invalid participantId: ${participantId}`
      )
      throw createError({
        statusCode: 403, // Forbidden
        statusMessage: "Invalid participant code.",
      })
    }

    // 4. Find the target Circle Event
    const targetEvent = await CircleEvent.findById(eventId)
    if (!targetEvent) {
      console.error(
        `postMessage attempt failed: Event not found with ID: ${eventId}`
      )
      throw createError({
        statusCode: 404, // Not Found
        statusMessage: "Target event not found.",
      })
    }

    // 5. Check if the participant is allowed in this event (Crucial Access Control)
    if (!targetEvent.participantIds.includes(participantId)) {
      console.warn(
        `postMessage attempt failed: Participant ${participantId} not authorized for event ${eventId}`
      )
      throw createError({
        statusCode: 403, // Forbidden
        statusMessage: "You are not authorized to post in this event.",
      })
    }

    // 6. Create the new message object
    const newMessage = {
      entityId: participantId, // The ID of who sent it
      text: text,
      // timestamp: new Date() // Mongoose default handles this in the schema now
    }

    // 7. Push the new message to the content array using MongoDB's $push
    // This is efficient! It only modifies the array.
    targetEvent.content.push(newMessage)

    // 8. Save the updated event document
    await targetEvent.save()

    console.log(
      `Message posted successfully by ${participantId} to event ${eventId}`
    )
    return { success: true, message: "Message posted successfully." }
  } catch (error) {
    // Catch errors from validation, finding, checking permissions, or saving
    console.error(`Error in postMessage endpoint for event ${eventId}:`, error)
    // If it's already an H3 error, rethrow it, otherwise create a generic 500
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: "An error occurred while posting the message.",
    })
  }
})
