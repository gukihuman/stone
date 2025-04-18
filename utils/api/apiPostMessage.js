// utils/api/apiPostMessage.js

/**
 * Calls the backend API to post a new message to a Circle Event.
 * @param {string} eventId The ID of the event to post to (e.g., '23punecc').
 * @param {string} participantId The validated participant code of the sender.
 * @param {string} text The message text to post.
 * @returns {Promise<object>} - Resolves with { success: true, message: '...' } if successful,
 *                              or { success: false, message: '...' } if an error occurs.
 */
export default async function (eventId, participantId, text) {
  if (!eventId || !participantId || text === undefined || text === null) {
    console.error(
      "apiPostMessage: eventId, participantId, and text are required."
    )
    return { success: false, message: "Missing required message parameters." }
  }

  try {
    // Use Nuxt's $fetch for client-side requests
    const response = await $fetch("/api/circle/postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        eventId: eventId,
        participantId: participantId,
        text: text,
      },
    })

    // Backend returns { success: true, message: '...' } on success
    return response
  } catch (error) {
    console.error(
      `Error calling /api/circle/postMessage for event ${eventId}:`,
      error
    )

    // Try to extract a specific error message from the response if it's an HTTP error
    const statusMessage =
      error.data?.statusMessage || error.message || "Failed to post message."

    // Return a standardized error format for the frontend to handle
    return { success: false, message: statusMessage }
  }
}
