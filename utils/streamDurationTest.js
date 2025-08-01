// utils/api/streamDurationTest.js
export default async function streamDurationTest(onChunk) {
  const { baseUrl } = useRuntimeConfig().public
  const res = await fetch(`${baseUrl}/api/stream-duration-test`, {
    headers: { Accept: "text/event-stream" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${res.statusText}`)
  if (!res.body) throw new Error("readable stream missing")
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let full = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = dec.decode(value, { stream: true })
    full += chunk
    onChunk?.(chunk)
  }
  return full
}
