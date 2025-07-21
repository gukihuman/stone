//〔 ~/utils/api/tts.js

//〔 our beautiful, stateful singleton for the audio context and scheduler.
//〔 this logic is adapted from the external oracle's "minimal scheduler" recommendation.
const SAMPLE_RATE = 24000
const LEAD_TIME = 0.1 //〔 seconds of safety buffer for scheduling.
let audioContext = null
let nextTime = 0

/**
 * 〔 takes raw pcm audio data, converts it, and schedules it for seamless playback.
 */
function enqueuePCMChunk(pcmData) {
  if (!audioContext) {
    audioContext = new window.AudioContext({ sampleRate: SAMPLE_RATE })
    nextTime = audioContext.currentTime + LEAD_TIME
  }

  //〔 convert the 16-bit pcm data (Uint8Array) into the float32 format.
  const float32Data = new Float32Array(pcmData.length / 2)
  for (let i = 0, j = 0; i < pcmData.length; i += 2, j++) {
    let val = (pcmData[i + 1] << 8) | pcmData[i]
    if (val & 0x8000) {
      val |= ~0xffff
    }
    float32Data[j] = val / 32768.0
  }

  //〔 create a buffer and schedule it on the continuous timeline.
  const audioBuffer = audioContext.createBuffer(
    1,
    float32Data.length,
    SAMPLE_RATE
  )
  audioBuffer.copyToChannel(float32Data, 0)

  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)
  source.start(nextTime)

  //〔 advance our timeline for the next chunk.
  nextTime += audioBuffer.duration
}

export default async function tts({ text, onComplete, onError }) {
  const { baseUrl } = useRuntimeConfig().public
  let res

  try {
    const accessToken = useCookie("access-token").value
    if (!accessToken) throw new Error("access-token not found for tts")

    res = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, accessToken }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`tts api error: ${res.status} - ${errorText}`)
    }
    if (!res.body) throw new Error("readable stream missing in tts response")

    const reader = res.body.getReader()

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      if (value) {
        enqueuePCMChunk(value)
      }
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
