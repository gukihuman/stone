// event and eventField used to preserve reactive mutability
export default async function ({
  message,
  event,
  eventField,
  locked,
  lockedField,
  onNextChunk,
  responseType,
}) {
  locked[lockedField] = true
  const response = await fetch("/api/gen", {
    method: "POST",
    body: JSON.stringify({ input: message }),
    headers: { "Content-Type": "application/json" },
  })
  let capturing = responseType === "string" ? true : false
  let buffer = ""
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer = new TextDecoder().decode(value)
    if (!capturing && buffer.includes("{")) {
      buffer = buffer.substring(buffer.indexOf("{"))
      capturing = true
    }
    if (responseType === "json" && capturing && buffer.includes("}")) {
      const endIndex = buffer.indexOf("}")
      event[eventField] += buffer.substring(0, endIndex + 1)
      onNextChunk(event)
      break // stop processing further chunks
    }
    if (capturing) {
      event[eventField] += buffer
      onNextChunk(event)
    }
  }
  locked[lockedField] = false
}
