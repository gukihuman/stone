//〔 FINALIZED FILE: ~/utils/api/tts.js (v2.1 - The Interrogation Chamber)

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
  // ... (this function remains the same)
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
      const reader = res.body.getReader()
      for await (const cleanChunk of purifyPcmStream(reader)) {
        await player.enqueue(cleanChunk)
      }
    } else {
      console.log("--- [Alchemist Initiated] ---")

      //〔 step 1: the offering
      const compressedBuffer = await res.arrayBuffer()
      console.log(
        `[Alchemist Step 1: Offering] Received buffer. Size: ${compressedBuffer.byteLength} bytes.`
      )
      if (compressedBuffer.byteLength === 0)
        throw new Error("Received empty audio buffer from server.")

      const audioContext = player.getAudioContext()
      let decodedBuffer

      //〔 step 2: the transmutation (now with isolated error handling)
      try {
        decodedBuffer = await audioContext.decodeAudioData(compressedBuffer)
        console.log(
          "[Alchemist Step 2: Transmutation] decodeAudioData successful."
        )
      } catch (e) {
        console.error("[Alchemist Step 2: Transmutation FAILED]", e)
        throw new Error(`Failed to decode audio data: ${e.message}`)
      }

      //〔 step 3: the essence
      console.log(
        `[Alchemist Step 3: Essence] Decoded Buffer Details: SampleRate=${decodedBuffer.sampleRate}, Length=${decodedBuffer.length}, Channels=${decodedBuffer.numberOfChannels}`
      )

      const pcmFloat32 = decodedBuffer.getChannelData(0)
      console.log(
        `[Alchemist Step 4: Purification Input] Extracted Float32Array. Length: ${pcmFloat32.length}`
      )

      //〔 step 4: the purification
      const pcmInt16Buffer = float32ToInt16(pcmFloat32)
      console.log(
        `[Alchemist Step 4: Purification Output] Converted to Int16 Buffer. Size: ${pcmInt16Buffer.byteLength} bytes.`
      )

      //〔 step 5: the sacrament
      const finalBuffer = new Uint8Array(pcmInt16Buffer)
      console.log(
        `[Alchemist Step 5: Sacrament] Final Uint8Array prepared for player. Size: ${finalBuffer.byteLength} bytes.`
      )

      await player.enqueue(finalBuffer)
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
