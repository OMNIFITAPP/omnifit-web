// Web Audio bell chime — no asset file needed.
// A soft sine + fifth harmonic with 2-second exponential decay at 70% volume.
export function playChime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)

    const tones: Array<[number, number]> = [
      [440, 1.0],   // fundamental A4
      [659.25, 0.35], // perfect fifth (E5)
      [880, 0.2],   // octave A5
    ]

    for (const [freq, relGain] of tones) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(relGain, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0)
      osc.connect(gain)
      gain.connect(master)
      osc.start(now)
      osc.stop(now + 2.1)
    }

    // Release the context after the tail finishes
    setTimeout(() => ctx.close().catch(() => {}), 2400)
  } catch {
    /* audio unsupported — no-op */
  }
}
