// utils/api/gen.js
export default async function gen({
  provider,
  model,
  input,
  onChunk,
  onComplete,
  onError,
}) {
  const baseUrl = useRuntimeConfig().public.baseUrl
  const url = new URL("/api/gen", baseUrl).href
  let res
  try {
    const stoneId = useCookie("stone-id").value
    if (!stoneId) throw new Error("stone-id not found for gen")
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ provider, model, input, stoneId }),
    })

    if (!res.ok) {
      let msg = `HTTP ${res.status} – ${res.statusText}`
      try {
        const err = await res.json()
        msg = err?.error || err?.message || msg
      } catch (_) {}
      throw new Error(msg)
    }
    if (!res.body) throw new Error("Readable stream missing in response")

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let full = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = dec.decode(value, { stream: true })
      full += chunk
      if (onChunk) onChunk(chunk)
    }

    if (onComplete) onComplete(full)
    return full
  } catch (err) {
    console.error("gen error:", err)
    if (onError) onError(err)
  }
}
