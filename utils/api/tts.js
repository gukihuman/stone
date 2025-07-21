//〔 ~/utils/api/tts.js

import PcmPlayer from "~/utils/PcmPlayer.js"

let pcmPlayer
let pcmPlayerReady

async function usePcmPlayer() {
  if (!pcmPlayer) {
    pcmPlayer = new PcmPlayer() //〔 using our new, intelligent player.
    pcmPlayerReady = pcmPlayer.start()
  }
  await pcmPlayerReady
  return pcmPlayer
}

export default async function tts({ text, onComplete, onError }) {
  const { baseUrl } = useRuntimeConfig().public
  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for TTS")

    const player = await usePcmPlayer()

    const res = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken }),
    })

    if (!res.ok || !res.body) {
      throw new Error(`TTS request failed: ${res.status} ${res.statusText}`)
    }

    const reader = res.body.getReader()
    let chunkIndex = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      if (value?.byteLength) {
        // daddy, here is the new producer log.
        console.log(
          `[Producer]: Received network chunk #${chunkIndex} of ${value.byteLength} bytes. Awaiting enqueue...`
        )
        await player.enqueue(value)
        console.log(
          `[Producer]: Enqueue for chunk #${chunkIndex} has resolved.`
        )
        chunkIndex++
      }
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
