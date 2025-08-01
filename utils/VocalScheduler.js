//〔 FINALIZED FILE: ~/utils/VocalScheduler.js (v2.0 - The Alchemist)

import PcmPlayer from "~/utils/PcmPlayer.js"

// -------------------------------------------------------------------------- //
// ------------------------ SELF-CONTAINED HELPERS -------------------------- //
// -------------------------------------------------------------------------- //

/**
 * 〔 a private async generator to handle the purification of any raw pcm stream.
 */
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

/**
 * 〔 the holy purification rite to convert Float32 PCM to Int16 PCM.
 */
function float32ToInt16(buffer) {
  let l = buffer.length
  const output = new Int16Array(l)
  while (l--) {
    output[l] = Math.min(1, buffer[l]) * 0x7fff
  }
  return output.buffer
}

// -------------------------------------------------------------------------- //
// ------------------------ THE SCHEDULER ENGINE -------------------------- //
// -------------------------------------------------------------------------- //

function createVocalScheduler() {
  const queue = []
  let isPlaying = false

  async function _fetchAudioStream({ text, provider }) {
    const { baseUrl } = useRuntimeConfig().public
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for TTS")

    //〔 we now return the full response object, not just the reader.
    return await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken, provider }),
    })
  }

  async function _processQueue() {
    if (isPlaying || queue.length === 0) return

    isPlaying = true
    const nextJob = queue.shift()
    const player = await usePcmPlayer()

    try {
      const res = await nextJob.fetchPromise
      if (!res.ok || !res.body) {
        throw new Error(`TTS request failed: ${res.status} ${res.statusText}`)
      }

      const contentType = res.headers.get("content-type")

      if (contentType && contentType.startsWith("audio/L16")) {
        //〔 this is our sacred PCM path (google, openai).
        const reader = res.body.getReader()
        for await (const cleanChunk of purifyPcmStream(reader)) {
          await player.enqueue(cleanChunk)
        }
      } else {
        //〔 this is our new Alchemist path for compressed audio (speechify).
        const compressedBuffer = await res.arrayBuffer()
        const audioContext = player.getAudioContext()
        const decodedBuffer = await audioContext.decodeAudioData(
          compressedBuffer
        )

        const pcmFloat32 = decodedBuffer.getChannelData(0)
        const pcmInt16Buffer = float32ToInt16(pcmFloat32)

        await player.enqueue(new Uint8Array(pcmInt16Buffer))
      }
    } catch (error) {
      console.error(`vocal scheduler error for job: ${nextJob.text}`, error)
    } finally {
      isPlaying = false
      _processQueue()
    }
  }

  return {
    add({ text, provider }) {
      const job = {
        text,
        fetchPromise: _fetchAudioStream({ text, provider }),
      }
      queue.push(job)
      _processQueue()
    },
  }
}

// -------------------------------------------------------------------------- //
// -------------------------- SINGLETON EXPORTS ----------------------------- //
// -------------------------------------------------------------------------- //

export const vocalScheduler = createVocalScheduler()

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
