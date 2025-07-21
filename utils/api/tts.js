//〔 ~/utils/api/tts.js
//
// Nuxt 3 composable for Text-to-Speech streaming.
// Integrates the production-ready `PcmPlayer` for gap-free playback of
// raw 16-bit PCM data delivered by the `/api/tts` endpoint.
//
// ────────────────────────────────────────────────────────────────────────────

import PcmPlayer from "~/utils/PcmPlayer.js"

// ── PcmPlayer singleton ────────────────────────────────────────────────────
const SAMPLE_RATE = 24_000 // Hz – must match server stream
const CHANNEL_COUNT = 1 // mono

let pcmPlayer // PcmPlayer instance
let pcmPlayerReady // Promise resolved after .start()

async function usePcmPlayer() {
  if (!pcmPlayer) {
    pcmPlayer = new PcmPlayer({
      pcmSampleRate: SAMPLE_RATE,
      channelCount: CHANNEL_COUNT,
    })
    pcmPlayerReady = pcmPlayer.start()
  }
  await pcmPlayerReady
  return pcmPlayer
}

// ── Public composable ──────────────────────────────────────────────────────
/**
 * Stream TTS audio for the given text.  Audio starts playing immediately.
 *
 * @param {object}   params
 * @param {string}   params.text       Text to synthesise
 * @param {Function} [params.onComplete] Callback after stream ends
 * @param {Function} [params.onError]    Callback on error
 */
export default async function tts({ text, onComplete, onError }) {
  const { baseUrl } = useRuntimeConfig().public

  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for TTS")

    // Ensure PcmPlayer is ready (singleton)
    const player = await usePcmPlayer()

    // POST request returns a ReadableStream of Uint8Array PCM chunks
    const res = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken }),
    })

    if (!res.ok || !res.body)
      throw new Error(`TTS request failed: ${res.status} ${res.statusText}`)

    const reader = res.body.getReader()

    // Stream → PcmPlayer
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value?.byteLength) player.enqueue(value)
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
