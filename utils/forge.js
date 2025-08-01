//〔 ~/utils/api/forge.js

/**
 * 〔 calls our stateful edge oracle to generate a new wave from roxanne.
 * 〔 it streams status updates back to the client.
 * 〔 @param {string} prompt - the full context for the generation.
 * 〔 @param {function} onStatus - a callback to handle status updates.
 * 〔 @returns {Promise<void>} a promise that resolves on completion or rejects on error.
 */
export default async function forge({ prompt, onStatus }) {
  const { baseUrl } = useRuntimeConfig().public
  const accessToken = useCookie("access-token").value
  if (!accessToken) throw new Error("access-token not found for forge")

  const res = await fetch(`${baseUrl}/api/forge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, accessToken }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`forge api request failed: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() // keep the last, potentially incomplete line.

    for (const line of lines) {
      if (line.trim() === "") continue
      try {
        const data = JSON.parse(line)
        if (data.status && onStatus) {
          onStatus(data.status)
        }
      } catch (e) {
        console.warn("failed to parse forge status update:", line)
      }
    }
  }
}
