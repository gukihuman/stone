// utils/api/apiGen.js
export default async function apiGen({
  provider,
  model,
  input,
  onChunk,
  onComplete,
  onError,
}) {
  // const baseURL = import.meta.dev ? "https://stone-seven.vercel.app" : ""
  const baseURL = import.meta.dev
    ? "https://stone-git-space-odyssey-gukis-projects.vercel.app"
    : ""

  const res = await fetch(`${baseURL}/api/gen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ provider, model, input }),
  })

  try {
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
      onChunk?.(chunk)
    }

    onComplete?.(full)
    return full
  } catch (err) {
    console.error("apiGen error:", err)
    onError?.(err)
  }
}
