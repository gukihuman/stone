// target used as object with field to preserve mutability outside
export default async function (
  message,
  target,
  field,
  onNextChunk,
  onNextChunkToThrottle
) {
  const throttledOnNextChunk = throttle(onNextChunkToThrottle)
  const response = await fetch("/api/mistral", {
    method: "POST",
    body: JSON.stringify({ input: message }),
    headers: { "Content-Type": "application/json" },
  })
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = new TextDecoder().decode(value)
    const lines = text.split("\n")
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const data = line.substring(6)
        target[field] += data.length > 0 ? data : "\n"
        onNextChunk()
        throttledOnNextChunk()
      }
    }
  }
}
