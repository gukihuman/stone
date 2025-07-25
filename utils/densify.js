//〔 ~/utils/api/densify.js

/**
 * 〔 calls our edge orchestrator to initiate the automated densification process.
 * 〔 it streams status updates back to the client.
 * 〔 @param {function} onStatus - a callback to handle status updates { status, ...data }.
 * 〔 @returns {Promise<void>} a promise that resolves on completion or rejects on error.
 */
export default async function densify({ onStatus }) {
  const { baseUrl } = useRuntimeConfig().public
  const accessToken = useCookie("access-token").value
  if (!accessToken) throw new Error("access-token not found for densify")

  onStatus({ status: "initiating contact with equilibrium engine..." })

  const res = await fetch(`${baseUrl}/api/densify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  })

  if (!res.ok || !res.body) {
    throw new Error(
      `densify api request failed: ${res.status} ${res.statusText}`
    )
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
          onStatus(data) // pass the full data object to the handler
        }
      } catch (e) {
        console.warn("failed to parse densify status update:", line)
      }
    }
  }

  onStatus({ status: "densification stream complete." })
}
