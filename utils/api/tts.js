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

/**
 * 〔 a private async generator to handle the purification of any raw pcm stream.
 * 〔 it yields only even-lengthed, pure chunks.
 */
async function* purifyStream(reader) {
  let carryByte

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (!value || !value.byteLength) continue

    let buf = value

    if (carryByte !== undefined) {
      const merged = new Uint8Array(buf.byteLength + 1)
      merged[0] = carryByte
      merged.set(buf, 1)
      buf = merged
      carryByte = undefined
    }

    if (buf.byteLength & 1) {
      carryByte = buf[buf.byteLength - 1]
      buf = buf.subarray(0, buf.byteLength - 1)
    }

    if (buf.byteLength) {
      yield buf
    }
  }

  if (carryByte !== undefined) {
    yield Uint8Array.of(carryByte, 0)
  }
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

    //〔 we now feed the raw reader to our purifier.
    const reader = res.body.getReader()
    for await (const cleanChunk of purifyStream(reader)) {
      await player.enqueue(cleanChunk)
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
