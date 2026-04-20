import { useEffect, useState } from 'react'
import { useTimerStore, elapsedSec, type TimerType, type TimerMode } from '../../store/timerStore'

const PRESETS = [60, 180, 300, 600]
const TYPES: Array<{ key: TimerType; label: string }> = [
  { key: 'countdown', label: 'Countdown' },
  { key: 'intervals', label: 'Intervals' },
  { key: 'emom', label: 'EMOM' },
  { key: 'tabata', label: 'Tabata' },
]

function fmt(sec: number): string {
  const s = Math.max(0, sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function TimerTab() {
  const state = useTimerStore()
  const { type, mode, presetSec, startedAt, accumulatedMs } = state

  // Live clock: re-render each second when running
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [startedAt])

  const elapsed = elapsedSec({ startedAt, accumulatedMs }, now)
  const displaySec = mode === 'countdown' ? Math.max(0, presetSec - elapsed) : elapsed

  // Auto-stop at the boundary
  useEffect(() => {
    if (startedAt == null) return
    if (mode === 'countdown' && presetSec - elapsed <= 0) state.pause()
    if (mode === 'countup' && elapsed >= presetSec) state.pause()
  }, [elapsed, mode, presetSec, startedAt, state])

  const running = startedAt != null
  const [toast, setToast] = useState<string | null>(null)

  function onSelectType(t: TimerType) {
    if (t === 'countdown') {
      state.setType(t)
    } else {
      setToast('Coming soon')
      setTimeout(() => setToast(null), 1400)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Type tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '4px',
          gap: '4px',
        }}
      >
        {TYPES.map((t) => {
          const active = type === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelectType(t.key)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '8px 4px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {(['countdown', 'countup'] as TimerMode[]).map((m) => {
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => state.setMode(m)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 14px',
                borderRadius: '999px',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                cursor: 'pointer',
              }}
            >
              {m === 'countdown' ? '↓ Count down' : '↑ Count up'}
            </button>
          )
        })}
      </div>

      {/* Display */}
      <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmt(displaySec)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '6px' }}>
          {mode === 'countup' ? `/ ${fmt(presetSec)} target` : ' '}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={state.reset}
          aria-label="Reset"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--ink2)',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => (running ? state.pause() : state.start())}
          aria-label={running ? 'Pause' : 'Play'}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--cream)',
            fontSize: '22px',
            cursor: 'pointer',
          }}
        >
          {running ? '❚❚' : '▶'}
        </button>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {PRESETS.map((sec) => {
          const active = presetSec === sec
          return (
            <button
              key={sec}
              type="button"
              onClick={() => state.setPreset(sec)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                background: active ? 'var(--rose)' : 'transparent',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              {sec / 60} min
            </button>
          )
        })}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ink)',
            color: 'var(--cream)',
            fontSize: '12px',
            padding: '8px 14px',
            borderRadius: '999px',
            zIndex: 250,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
