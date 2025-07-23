//〔 ~/utils/api/tts.js

import PcmPlayer from "~/utils/PcmPlayer.js"

let pcmPlayer
let pcmPlayerReady

async function usePcmPlayer() {
  if (!pcmPlayer) {
    pcmPlayer = new PcmPlayer()
    pcmPlayerReady = pcmPlayer.start()
  }
  await pcmPlayerReady
  return pcmPlayer
}

export default async function tts({ text, provider, onComplete, onError }) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for TTS")

    const player = await usePcmPlayer()

    const res = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken, provider }),
    })

    if (!res.ok || !res.body) {
      throw new Error(`TTS request failed: ${res.status} ${res.statusText}`)
    }

    const reader = res.body.getReader()
    let chunkIndex = 0
    let carryByte // undefined | number (0‑255) persists across network chunks

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (!value || !value.byteLength) continue

      console.log(
        `[Producer]: Received network chunk #${chunkIndex} of ${value.byteLength} bytes. Awaiting enqueue...`
      )

      let buf = value

      /* prepend stray byte from previous chunk (if any) */
      if (carryByte !== undefined) {
        const merged = new Uint8Array(buf.byteLength + 1)
        merged[0] = carryByte
        merged.set(buf, 1)
        buf = merged
        carryByte = undefined
      }

      /* split off new stray byte (if odd length) */
      if (buf.byteLength & 1) {
        carryByte = buf[buf.byteLength - 1]
        buf = buf.subarray(0, buf.byteLength - 1)
      }

      /* enqueue only even‑length payload */
      if (buf.byteLength) {
        console.log(
          `[Producer]: Enqueueing ${buf.byteLength} bytes (even length).`
        )
        await player.enqueue(buf)
      }

      chunkIndex++
    }

    /* flush final carry, if any */
    if (carryByte !== undefined) {
      await player.enqueue(Uint8Array.of(carryByte, 0))
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
