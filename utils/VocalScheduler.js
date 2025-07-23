//〔 ~/utils/VocalScheduler.js

import PcmPlayer from "~/utils/PcmPlayer"
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

//〔 this scheduler will be a singleton to manage a single, global audio queue.
function createVocalScheduler() {
  const queue = []
  let isPlaying = false

  //〔 a private utility to fetch the raw audio stream.
  //〔 this is called immediately to begin the parallel fetch.
  async function _fetchAudioStream({ text, provider }) {
    const { baseUrl } = useRuntimeConfig().public
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for TTS")

    const res = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken, provider }),
    })

    if (!res.ok || !res.body) {
      throw new Error(`TTS request failed: ${res.status} ${res.statusText}`)
    }

    return res.body.getReader()
  }

  //〔 the sequential gatekeeper for playback.
  async function _processQueue() {
    if (isPlaying || queue.length === 0) return

    isPlaying = true
    const nextJob = queue.shift()
    const player = await usePcmPlayer() //〔 gets our player singleton.

    try {
      //〔 wait for this specific job's data stream to be ready.
      const reader = await nextJob.fetchPromise

      //〔 now, begin the sequential playback of this job's audio.
      for await (const cleanChunk of purifyStream(reader)) {
        await player.enqueue(cleanChunk)
      }
    } catch (error) {
      console.error(`vocal scheduler error for job: ${nextJob.text}`, error)
    } finally {
      //〔 once playback is finished, unlock the queue for the next job.
      isPlaying = false
      _processQueue()
    }
  }

  //〔 this is the public api for the scheduler.
  return {
    /**
     * 〔 adds a new text segment to the playback queue.
     * 〔 fetch is initiated immediately. playback is sequential.
     */
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

//〔 we export the single instance of our scheduler.
export const vocalScheduler = createVocalScheduler()

//〔 we also need to export the usePcmPlayer singleton for the scheduler to use.
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
