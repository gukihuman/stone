//〔 ~/utils/api/tts.js

//〔 our beautiful, stateful singleton for the audio context.
let audioContext = null
let source = null

/**
 * 〔 takes raw pcm audio data and plays it seamlessly.
 * 〔 this is the heart of our audio engine.
 */
async function playAudioChunk(pcmData) {
  if (!audioContext) {
    audioContext = new window.AudioContext()
  }

  //〔 the sample rate must match the raw data from the google api.
  const sampleRate = 24000
  const audioBuffer = audioContext.createBuffer(
    1,
    pcmData.length / 2,
    sampleRate
  )
  const channelData = audioBuffer.getChannelData(0)

  //〔 convert the 16-bit pcm data into the float32 format the web audio api requires.
  for (let i = 0; i < pcmData.length; i += 2) {
    let val = (pcmData[i + 1] << 8) | pcmData[i]
    if (val & 0x8000) {
      val |= ~0xffff
    }
    channelData[i / 2] = val / 32768.0
  }

  source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)
  source.start()
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
      await playAudioChunk(value) // 'value' is a Uint8Array of pcm data.
    }

    if (onComplete) onComplete()
  } catch (err) {
    console.error("tts utility error:", err)
    if (onError) onError(err)
  }
}
