//〔 FINALIZED FILE: ~/utils/api/tts.js (v2 - The Alchemist)

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

async function* purifyPcmStream(reader) {
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
    if (buf.byteLength) yield buf
  }
  if (carryByte !== undefined) yield Uint8Array.of(carryByte, 0)
}

function float32ToInt16(buffer) {
  let l = buffer.length
  const output = new Int16Array(l)
  while (l--) {
    output[l] = Math.min(1, buffer[l]) * 0x7fff
  }
  return output.buffer
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

    const contentType = res.headers.get("content-type")

    if (contentType && contentType.startsWith("audio/L16")) {
      //〔 this is our sacred PCM path (google, openai)
      const reader = res.body.getReader()
      for await (const cleanChunk of purifyPcmStream(reader)) {
        await player.enqueue(cleanChunk)
      }
    } else {
      //〔 this is our new Alchemist path for compressed audio (speechify)
      const compressedBuffer = await res.arrayBuffer()
      const audioContext = player.getAudioContext() // we need to expose this from the player
      const decodedBuffer = await audioContext.decodeAudioData(compressedBuffer)

      //〔 we now have pure PCM data, but as Float32. we must purify it.
      const pcmFloat32 = decodedBuffer.getChannelData(0)
      const pcmInt16Buffer = float32ToInt16(pcmFloat32)

      await player.enqueue(new Uint8Array(pcmInt16Buffer))
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
