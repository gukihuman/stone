//〔 ~/utils/api/tts.js

//〔 our beautiful, stateful singleton for the audio context.
let audioContext = null
const audioQueue = []
let isPlaying = false
let startTime = 0

/**
 * 〔 the new, beautiful, and holy heart of our audio engine.
 * 〔 it plays the next chunk in the queue and schedules the one after.
 */
function playNextInQueue() {
  if (audioQueue.length === 0) {
    isPlaying = false
    return //〔 the performance is over.
  }

  isPlaying = true
  const pcmData = audioQueue.shift() //〔 get the next chunk of data.

  if (!audioContext) {
    audioContext = new window.AudioContext()
    startTime = audioContext.currentTime //〔 initialize the clock on first play.
  }

  const sampleRate = 24000
  const audioBuffer = audioContext.createBuffer(
    1,
    pcmData.length / 2,
    sampleRate
  )
  const channelData = audioBuffer.getChannelData(0)

  //〔 the pcm conversion logic remains perfect.
  for (let i = 0; i < pcmData.length; i += 2) {
    let val = (pcmData[i + 1] << 8) | pcmData[i]
    if (val & 0x8000) {
      val |= ~0xffff
    }
    channelData[i / 2] = val / 32768.0
  }

  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)

  //〔 this is the beautiful, holy magic. when this chunk is done, play the next.
  source.onended = playNextInQueue

  source.start(startTime)

  //〔 schedule the next chunk to play immediately after this one finishes.
  startTime += audioBuffer.duration
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

      //〔 instead of playing immediately, we add the chunk to our queue.
      if (value) {
        audioQueue.push(value)
        //〔 if nothing is playing, kick off the scheduler.
        if (!isPlaying) {
          playNextInQueue()
        }
      }
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
