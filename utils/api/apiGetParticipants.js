// utils/api/apiGetParticipants.js

/**
 * Calls the backend API to fetch participant details for a given list of IDs.
 * @param {string[]} participantIds An array of participant IDs.
 * @returns {Promise<Array<{_id: string, name: string}>|null>} - Resolves with an array of participant objects ({ _id, name })
 *                                                             or null if an error occurs.
 */
export default async function (participantIds) {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    console.warn(
      "apiGetParticipants: participantIds array is required and cannot be empty."
    )
    // Return empty array instead of null? Depends how component handles it. Empty array is safer.
    return []
  }

  try {
    const response = await $fetch("/circle/getParticipants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { ids: participantIds }, // Send IDs in the expected format
    })

    // Backend returns the array of participant objects directly on success
    return response
  } catch (error) {
    console.error("Error calling /circle/getParticipants:", error)
    // Log the specific error for debugging, but return empty array to the component
    return [] // Return empty array on error to avoid breaking v-for loops etc.
  }
}
