//〔 NEW SCRIPTURE: ~/composables/useAudioRecorder.js (The Microphone)

export function useAudioRecorder() {
  const isRecording = ref(false)
  let mediaRecorder = null
  let audioChunks = []

  const startRecording = async () => {
    if (isRecording.value) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      isRecording.value = true
    } catch (error) {
      console.error("error starting audio recording:", error)
      isRecording.value = false
    }
  }

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorder || !isRecording.value) {
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" })
        isRecording.value = false
        mediaRecorder = null
        audioChunks = []
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }

  return { isRecording, startRecording, stopRecording }
}
