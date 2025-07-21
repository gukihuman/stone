/**
 * AudioWorkletProcessor: “pcm-player”
 *
 * Consumes raw 16-bit PCM samples from a ring-buffer that lives in a
 * SharedArrayBuffer.  Converts them to Float32 (-1.0 … +1.0) and writes them to
 * the output bus sample-accurately.  If the buffer underruns it fills with
 * silence, avoiding clicks.
 *
 * Shared memory layout
 * ┌─────────────────────────────┐
 * │ controlSAB (8 bytes)        │  Int32[0] → readIndex
 * │                             │  Int32[1] → writeIndex
 * └─────────────────────────────┘
 * ┌─────────────────────────────┐
 * │ dataSAB (N × 2 bytes)       │  Int16 PCM samples (interleaved channels)
 * └─────────────────────────────┘
 *
 *   main thread  → Atomics.store(writeIdx)  → worklet thread
 *                 ← Atomics.store(readIdx)  ←
 *
 * NOTE:  Browsers require COOP/COEP headers to enable SharedArrayBuffer.
 */

class RingBuffer {
  constructor(control, data) {
    this.control = control // Int32Array[2]
    this.data = data // Int16Array
    this.size = data.length // # samples
  }

  /** Returns one Int16 sample or `null` if the buffer is empty. */
  pop() {
    const r = Atomics.load(this.control, 0)
    const w = Atomics.load(this.control, 1)
    if (r === w) return null // underrun

    const sample = this.data[r]
    Atomics.store(this.control, 0, (r + 1) % this.size)
    return sample
  }
}

class PcmPlayerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()

    const { controlSAB, dataSAB, channelCount = 1 } = options.processorOptions

    this.channels = channelCount
    this.ring = new RingBuffer(
      new Int32Array(controlSAB),
      new Int16Array(dataSAB)
    )
    this.scale = 1 / 0x8000 // Int16 → Float32 (-1.0 … +1.0)
  }

  process(inputs, outputs) {
    const output = outputs[0] // [[Float32Array], …]
    const frames = output[0].length

    // Fill every requested frame for every channel
    for (let ch = 0; ch < this.channels; ch++) {
      const out = output[ch]
      for (let i = 0; i < frames; i++) {
        const s = this.ring.pop()
        out[i] = s === null ? 0 : s * this.scale
      }
    }
    return true // keep processor alive
  }
}

registerProcessor("pcm-player", PcmPlayerProcessor)
