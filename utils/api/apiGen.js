// utils/api/apiGen.js

/**
 * Calls the backend /api/gen endpoint to generate text using a specified LLM provider and model.
 * Handles the response as a stream, invoking callbacks for each chunk and when the stream ends.
 *
 * @param {object} options - The options for the generation call.
 * @param {string} options.provider - The LLM provider ('openai' or 'google').
 * @param {string} options.model - The specific model name.
 * @param {string} options.input - The prompt/context string.
 * @param {function(string): void} options.onChunk - Callback function invoked with each text chunk received.
 * @param {function(string): void} options.onComplete - Callback function invoked with the full assembled text when the stream finishes successfully.
 * @param {function(Error): void} options.onError - Callback function invoked if an error occurs during streaming or fetching.
 */
export default async function ({
  provider,
  model,
  input,
  onChunk,
  onComplete,
  onError,
}) {
  let accumulatedText = "" // To store the full response

  try {
    // const response = await fetch("/api/gen", {
    const response = await fetch("/api/gen-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream", // Indicate we expect a stream
      },
      body: JSON.stringify({ provider, model, input }),
    })

    if (!response.ok) {
      // Handle non-2xx responses (e.g., 400, 500 errors from the backend endpoint itself)
      let errorPayload = {
        message: `API request failed: ${response.status} ${response.statusText}`,
      }
      try {
        // Attempt to parse specific error message from backend if available
        const errorData = await response.json()
        errorPayload = errorData // Use the structured error from backend
      } catch (parseError) {
        // Ignore if response body isn't JSON
      }
      console.error("apiGen fetch error:", errorPayload)
      throw new Error(
        errorPayload.statusMessage ||
          errorPayload.message ||
          `HTTP error ${response.status}`
      )
    }

    // Check if the response body is readable stream
    if (!response.body) {
      throw new Error("Response body is not readable stream.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // Read the stream
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log("apiGen stream finished.")
        break // Exit the loop when the stream is done
      }

      // Decode the chunk (Uint8Array) to text
      const textChunk = decoder.decode(value, { stream: true })
      console.log("apiGen received chunk:", textChunk) // Debugging

      // Check for potential error messages embedded in the stream (if backend sends them like this)
      if (textChunk.startsWith("ERROR: ")) {
        throw new Error(`Stream error: ${textChunk.substring(7)}`)
      }

      accumulatedText += textChunk

      // Invoke the onChunk callback with the received text chunk
      if (onChunk && typeof onChunk === "function") {
        try {
          onChunk(textChunk)
        } catch (chunkError) {
          console.error("Error in onChunk callback:", chunkError)
          // Decide if you want to stop streaming on callback error
        }
      }
    }

    // Stream finished successfully, invoke the onComplete callback with the full text
    if (onComplete && typeof onComplete === "function") {
      try {
        onComplete(accumulatedText)
      } catch (completeError) {
        console.error("Error in onComplete callback:", completeError)
        // Potentially call onError here as well?
        if (onError && typeof onError === "function") {
          onError(completeError)
        }
      }
    }
  } catch (error) {
    console.error("Error in apiGen utility:", error)
    // Invoke the onError callback if provided
    if (onError && typeof onError === "function") {
      try {
        onError(error)
      } catch (errorCallbackError) {
        console.error("Error in onError callback itself:", errorCallbackError)
      }
    }
    // Decide if you want to re-throw the error or just let the callback handle it
    // throw error; // Optional: re-throw if the calling component needs to know about the failure beyond the callback
  }
}
