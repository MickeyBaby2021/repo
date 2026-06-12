// AudioWorklet that captures mono microphone audio, downsamples it to 24 kHz,
// converts to PCM16, and posts ~100ms frames back to the main thread.
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._targetRate = 24000
    this._buffer = []
    // ~100ms of 24kHz audio per frame.
    this._frameSize = 2400
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const channel = input[0]
    if (!channel) return true

    // Downsample from the context sample rate to 24 kHz (linear decimation).
    const ratio = sampleRate / this._targetRate
    for (let i = 0; i < channel.length; i += ratio) {
      const sample = channel[Math.floor(i)] || 0
      // Clamp and convert float [-1,1] to PCM16.
      const s = Math.max(-1, Math.min(1, sample))
      this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7fff)
    }

    while (this._buffer.length >= this._frameSize) {
      const frame = this._buffer.slice(0, this._frameSize)
      this._buffer = this._buffer.slice(this._frameSize)
      const pcm = new Int16Array(frame)
      this.port.postMessage(pcm.buffer, [pcm.buffer])
    }
    return true
  }
}

registerProcessor("capture-processor", CaptureProcessor)
