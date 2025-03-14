// genEvent and field used to preserve reactive mutability
export default async function (
  message,
  genEvent,
  field,
  genLocked,
  onNextChunk,
  responseType = "string"
) {
  genLocked.value = true
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
      genEvent[field] += buffer.substring(0, endIndex + 1)
      onNextChunk(genEvent)
      break // stop processing further chunks
    }
    if (capturing) {
      console.log(onNextChunk)
      genEvent[field] += buffer
      onNextChunk(genEvent)
    }
  }
  genLocked.value = false
}
