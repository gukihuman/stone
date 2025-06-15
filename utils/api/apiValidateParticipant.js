// ❗ old
/**
 * Calls the backend API to validate a participant ID (invite code).
 * @param {string} participantId The invite code to validate.
 * @returns {Promise<object|null>} - Resolves with
 * { success: true, participant: { _id, name, role } } if valid,
 * { success: false, message: string } if invalid,
 * or null if a network/server error occurs.
 */
export default async function (participantId) {
  if (!participantId) {
    console.error("apiValidateParticipant: participantId is required.")
    return { success: false, message: "Participant ID cannot be empty." }
  }

  try {
    const response = await $fetch("/circle/validateParticipant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { _id: participantId },
    })

    return response
  } catch (error) {
    console.error("Error calling /circle/validateParticipant:", error)

    // Try to extract a specific error message from the response if it's an HTTP error
    const statusMessage =
      error.data?.statusMessage ||
      error.message ||
      "Failed to validate participant ID."

    // Return a standardized error format for the frontend to handle
    return { success: false, message: statusMessage }
  }
}
