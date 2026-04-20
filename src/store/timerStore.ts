import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TimerMode = 'countdown' | 'countup'
export type TimerType = 'countdown' | 'intervals' | 'emom' | 'tabata'

interface TimerState {
  type: TimerType            // only 'countdown' is functional; others are visual-only
  mode: TimerMode            // direction within the countdown type
  presetSec: number          // target duration
  // Running state is represented by an absolute anchor so it survives tab switches.
  // elapsedMs = (running ? now - startedAt : 0) + accumulatedMs
  startedAt: number | null   // epoch ms when the current run segment started
  accumulatedMs: number      // time accrued from completed (paused) segments
}

interface TimerActions {
  setType: (t: TimerType) => void
  setMode: (m: TimerMode) => void
  setPreset: (sec: number) => void
  start: () => void
  pause: () => void
  reset: () => void
}

const DEFAULT: TimerState = {
  type: 'countdown',
  mode: 'countdown',
  presetSec: 5 * 60,
  startedAt: null,
  accumulatedMs: 0,
}

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT,

      setType: (t) => set({ type: t }),
      setMode: (m) => {
        // Changing direction resets the running clock
        set({ mode: m, startedAt: null, accumulatedMs: 0 })
      },
      setPreset: (sec) => set({ presetSec: sec, startedAt: null, accumulatedMs: 0 }),

      start: () => {
        if (get().startedAt != null) return
        set({ startedAt: Date.now() })
      },
      pause: () => {
        const { startedAt, accumulatedMs } = get()
        if (startedAt == null) return
        set({ startedAt: null, accumulatedMs: accumulatedMs + (Date.now() - startedAt) })
      },
      reset: () => set({ startedAt: null, accumulatedMs: 0 }),
    }),
    { name: 'omnifit-timer' }
  )
)

/** Returns current elapsed seconds (live; call within a tick). */
export function elapsedSec(s: Pick<TimerState, 'startedAt' | 'accumulatedMs'>, now = Date.now()) {
  const ms = s.accumulatedMs + (s.startedAt != null ? now - s.startedAt : 0)
  return Math.floor(ms / 1000)
}
