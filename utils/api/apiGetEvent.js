/**
 * Calls the backend API to fetch a specific Circle Event.
 * @param {string} eventId The ID of the event to fetch (e.g., '23punecc').
 * @param {string} participantId The validated participant id of the requester.
 * @returns {Promise<object|null>} - Resolves with the full event object if successful and authorized,
 *                                   or null if an error occurs (e.g., not found, not authorized, server error).
 */
export default async function (eventId, participantId) {
  if (!eventId || !participantId) {
    console.error("apiGetEvent: eventId and participantId are required.")
    return null // Or throw an error, depending on desired handling
  }

  try {
    // Construct the URL with query parameters
    const apiUrl = `/api/circle/getEvent?eventId=${encodeURIComponent(
      eventId
    )}&participantId=${encodeURIComponent(participantId)}`

    // Use Nuxt's $fetch for client-side requests
    const eventData = await $fetch(apiUrl, {
      method: "GET", // GET request, parameters are in the URL
    })

    // Backend returns the event object directly on success
    return eventData
  } catch (error) {
    console.error(
      `Error calling /api/circle/getEvent for event ${eventId}:`,
      error
    )

    // $fetch throws errors for non-2xx responses, error object often contains details
    // Log the specific error for debugging, but return null to the component
    // The component can then decide how to handle the lack of data (e.g., show error message)
    // You could also return error.data?.statusMessage if you want to pass specific messages
    return null
  }
}
