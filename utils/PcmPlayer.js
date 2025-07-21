/**
 * PcmPlayer – high-level main-thread façade
 *
 * Usage:
 *   import PcmPlayer from './PcmPlayer.js';
 *
 *   const player = new PcmPlayer({ pcmSampleRate: 24000 });
 *   await player.start();
 *
 *   // whenever a Uint8Array of raw PCM arrives:
 *   player.enqueue(chunk);
 *
 *   // later:
 *   await player.stop();
 */

export default class PcmPlayer {
  /**
   * @param {object} opts
   * @param {number} [opts.pcmSampleRate=24000]  Incoming PCM sample-rate (Hz).
   * @param {number} [opts.channelCount=1]       Mono = 1, stereo = 2, …
   * @param {number} [opts.bufferSeconds=2]      Ring-buffer length (seconds).
   */
  constructor({
    pcmSampleRate = 24000,
    channelCount = 1,
    bufferSeconds = 2,
  } = {}) {
    this.pcmRate = pcmSampleRate
    this.channels = channelCount
    this.capacity = pcmSampleRate * bufferSeconds * channelCount

    /* Shared memory ------------------------------------------------------- */
    this.controlSAB = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2)
    this.dataSAB = new SharedArrayBuffer(
      Int16Array.BYTES_PER_ELEMENT * this.capacity
    )

    this.control = new Int32Array(this.controlSAB) // [readIdx, writeIdx]
    this.data = new Int16Array(this.dataSAB) // PCM samples

    /* Audio graph --------------------------------------------------------- */
    this.ctx = null
    this.worklet = null
  }

  /* Internal: one-time AudioContext + worklet boot ------------------------ */
  async #boot() {
    if (this.ctx) return // already booted

    /* Prefer matching the context’s sample-rate to avoid resampling cost.   */
    try {
      this.ctx = new AudioContext({ sampleRate: this.pcmRate })
    } catch {
      this.ctx = new AudioContext() // fallback – may differ from pcmRate
      if (this.ctx.sampleRate !== this.pcmRate) {
        console.warn(
          `[PcmPlayer] Context rate ${this.ctx.sampleRate} ≠ stream rate ${this.pcmRate}. ` +
            "Audio will play at the context rate (pitch/speed change)."
        )
      }
    }

    /* `pcm-player.js` must be served with COOP/COEP headers for SAB.        */
    await this.ctx.audioWorklet.addModule("pcm-player.js")

    this.worklet = new AudioWorkletNode(this.ctx, "pcm-player", {
      channelCount: this.channels,
      outputChannelCount: [this.channels],
      processorOptions: {
        controlSAB: this.controlSAB,
        dataSAB: this.dataSAB,
        channelCount: this.channels,
      },
    })

    this.worklet.connect(this.ctx.destination)
  }

  /* Public API ------------------------------------------------------------ */

  /** Starts (or resumes) playback.  Idempotent. */
  async start() {
    await this.#boot()
    if (this.ctx.state === "suspended") await this.ctx.resume()
  }

  /** Gracefully stops playback and releases the AudioContext. */
  async stop() {
    if (!this.ctx) return
    await this.ctx.close()
    this.ctx = null
    this.worklet = null
  }

  /**
   * Enqueue a new chunk of raw PCM (Uint8Array, little-endian int16).
   * Overrun protection: if the buffer is full, remaining samples are dropped.
   */
  enqueue(uint8) {
    if (!(uint8 instanceof Uint8Array))
      throw new TypeError("enqueue() expects Uint8Array")

    // View the incoming bytes as Int16 (sample-aligned)
    const src = new Int16Array(
      uint8.buffer,
      uint8.byteOffset,
      uint8.byteLength >> 1
    )

    const cap = this.capacity
    let readIdx = Atomics.load(this.control, 0)
    let writeIdx = Atomics.load(this.control, 1)

    for (let i = 0; i < src.length; i++) {
      const next = (writeIdx + 1) % cap
      if (next === readIdx) {
        // ring full → drop remainder
        console.warn("[PcmPlayer] Ring buffer overrun – dropping samples.")
        break
      }
      this.data[writeIdx] = src[i]
      writeIdx = next
    }
    Atomics.store(this.control, 1, writeIdx)
  }
}
