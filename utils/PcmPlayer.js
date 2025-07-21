/**
 * PcmPlayer – main-thread façade with back-pressure awareness
 *
 * Public API:
 *   const player = new PcmPlayer()
 *   await player.start()
 *   await player.enqueue(chunk)   // Uint8Array
 *   await player.stop()
 */

export default class PcmPlayer {
  constructor({
    pcmSampleRate = 24_000,
    channelCount = 1,
    bufferSeconds = 4, // larger default (4 s) for burst tolerance
    highWaterMark = 0.9, // 90 % full → apply back-pressure
    pollInterval = 8, // ms to wait before re-checking space
  } = {}) {
    this.pcmRate = pcmSampleRate
    this.channels = channelCount
    this.capacity = pcmSampleRate * bufferSeconds * channelCount

    /* Shared ring-buffer -------------------------------------------------- */
    this.controlSAB = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2)
    this.dataSAB = new SharedArrayBuffer(
      Int16Array.BYTES_PER_ELEMENT * this.capacity
    )
    this.control = new Int32Array(this.controlSAB) // [readIdx, writeIdx]
    this.data = new Int16Array(this.dataSAB)

    /* Audio graph --------------------------------------------------------- */
    this.ctx = null
    this.worklet = null

    /* Back-pressure parameters ------------------------------------------- */
    this.highWater = Math.floor(this.capacity * highWaterMark)
    this.pollMs = pollInterval
  }

  /* ──────────────────────────────────────────────────────────────────── */

  async #boot() {
    if (this.ctx) return
    try {
      this.ctx = new AudioContext({ sampleRate: this.pcmRate })
    } catch {
      this.ctx = new AudioContext()
    }
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

  async start() {
    await this.#boot()
    if (this.ctx.state === "suspended") await this.ctx.resume()
  }

  async stop() {
    if (!this.ctx) return
    await this.ctx.close()
    this.ctx = this.worklet = null
  }

  /* Helper: wait `pollMs` without blocking UI --------------------------- */
  #sleep() {
    return new Promise((r) => setTimeout(r, this.pollMs))
  }

  /* ── Back-pressure-aware enqueue ─────────────────────────────────────── */
  async enqueue(uint8) {
    if (!(uint8 instanceof Uint8Array))
      throw new TypeError("enqueue() expects Uint8Array")

    const src = new Int16Array(
      uint8.buffer,
      uint8.byteOffset,
      uint8.byteLength >> 1
    )
    let offset = 0
    const cap = this.capacity

    while (offset < src.length) {
      const readIdx = Atomics.load(this.control, 0)
      const writeIdx = Atomics.load(this.control, 1)

      /* Free slots in ring (-1 to keep read≠write distinction) */
      let space = (readIdx - writeIdx - 1 + cap) % cap
      const used = cap - space

      /* If nearly full, yield to audio thread before retrying */
      if (used >= this.highWater || space === 0) {
        await this.#sleep()
        continue
      }

      /* Copy at most `space` samples this iteration */
      const chunk = Math.min(space, src.length - offset)

      if (writeIdx + chunk <= cap) {
        // contiguous copy
        this.data.set(src.subarray(offset, offset + chunk), writeIdx)
      } else {
        // wrap-around copy
        const first = cap - writeIdx
        this.data.set(src.subarray(offset, offset + first), writeIdx)
        this.data.set(src.subarray(offset + first, offset + chunk), 0)
      }

      Atomics.store(this.control, 1, (writeIdx + chunk) % cap)
      offset += chunk
    }
  }
}
