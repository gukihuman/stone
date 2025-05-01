// api/gen-test.js
// No Langchain imports needed here!

export const config = { runtime: "edge" }

// Simple sleep helper function for async delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function handler(req) {
  // We don't actually need the request body for this test,
  // but parsing it might be useful if you wanted to parameterize the test later (e.g., duration).
  // For now, we'll keep it minimal.
  console.log("[gen-test.js] Received request.")

  // Stream ↦ TextEncoder ↦ TransformStream (Same setup as gen.js)
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  // Start the timed streaming process in the background
  ;(async () => {
    console.log("[gen-test.js] Starting 100-second test stream...")
    try {
      for (let i = 1; i <= 100; i++) {
        // Create the string for the current number and a newline
        const dataString = `${i}\n`
        // Encode the string to Uint8Array
        const encodedData = enc.encode(dataString)
        // Write the encoded data to the stream
        await writer.write(encodedData)
        console.log(`[gen-test.js] Sent chunk: ${i}`)

        // Wait for 1 second before sending the next chunk
        await sleep(1000)
      }
      // After the loop finishes, close the writer to signal the end of the stream
      await writer.close()
      console.log(
        "[gen-test.js] Test stream finished successfully after 100 chunks."
      )
    } catch (e) {
      // If any error occurs during the loop (e.g., writer error), abort the writer
      console.error("[gen-test.js] Error during streaming loop:", e)
      await writer.abort(e)
    }
  })() // Immediately invoke the async function

  // Return the standard Response object with the readable stream
  // The browser's EventSource will connect to this readable stream
  console.log("[gen-test.js] Returning Response object with readable stream.")
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive", // Important for SSE
    },
    // Status defaults to 200 OK
  })
}
