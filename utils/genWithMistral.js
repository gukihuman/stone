export const RESPONSE_TYPE = { STRING: 0, JSON: 1 }

// target used as object with field to preserve mutability outside
export default async function (
  message,
  target,
  field,
  onNextChunk,
  responseType = RESPONSE_TYPE.STRING
) {
  const response = await fetch("/api/mistral", {
    method: "POST",
    body: JSON.stringify({ input: message }),
    headers: { "Content-Type": "application/json" },
  })
  let capturing = responseType === RESPONSE_TYPE.STRING ? true : false
  let buffer = ""
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer = new TextDecoder().decode(value)
    if (!capturing && buffer.includes("[")) {
      buffer = buffer.substring(buffer.indexOf("["))
      capturing = true
    }
    if (capturing) {
      target[field] += buffer
      onNextChunk()
    }
    if (responseType && capturing && buffer.includes("]")) {
      const endIndex = buffer.indexOf("]")
      target[field] += buffer.substring(0, endIndex)
      onNextChunk()
      break // stop processing further chunks
    }
  }
}
