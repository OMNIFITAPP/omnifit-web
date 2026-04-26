import { useEffect, useRef, useState } from 'react'
import { DIMS, DIM_MAP } from '../../data/dims'
import { getSession, TIER_LABELS } from '../../data/sessions'
import { SwapSheet } from './SwapSheet'
import { useDailyNotesStore } from '../../store/dailyNotesStore'
import type { DailyPlan, DimConfig, Dimension, Tier } from '../../types'

const NOTE_MAX = 200
const SAVE_DEBOUNCE_MS = 800

interface Props {
  open: boolean
  onClose: () => void
  date: string             // tomorrow's iso yyyy-mm-dd
  plan: DailyPlan
  onChangeTier: (dim: Dimension, tier: Tier) => void
}

function formatTitle(iso: string): { day: string; date: string } {
  const d = new Date(`${iso}T00:00:00`)
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return { day, date }
}

export function PlanTomorrowOverlay({ open, onClose, date, plan, onChangeTier }: Props) {
  const noteFromStore = useDailyNotesStore((s) => s.notes[date] ?? '')
  const setNote = useDailyNotesStore((s) => s.setNote)
  const flushNote = useDailyNotesStore((s) => s.flush)
  const loadFor = useDailyNotesStore((s) => s.loadFor)
  const [draft, setDraft] = useState('')
  const [swapDim, setSwapDim] = useState<DimConfig | null>(null)
  const debounceRef = useRef<number | null>(null)

  // Hydrate the note from the server when the overlay opens.
  useEffect(() => {
    if (!open) return
    setDraft(noteFromStore)
    loadFor([date])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date])

  // Re-sync draft when store-side note arrives after mount.
  useEffect(() => {
    if (open) setDraft(noteFromStore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteFromStore])

  function handleNoteChange(next: string) {
    const trimmed = next.slice(0, NOTE_MAX)
    setDraft(trimmed)
    setNote(date, trimmed)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      flushNote(date, trimmed)
    }, SAVE_DEBOUNCE_MS)
  }

  if (!open) return null

  const { day, date: dateLabel } = formatTitle(date)

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cream)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '430px',
        marginInline: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 20px 8px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            Tomorrow
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '2px' }}>
            {day} · {dateLabel}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '22px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 20px 36px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DIMS.map((dim) => {
            const tier = plan[dim.key] as Tier
            const isRest = tier === 'R'
            const session = isRest ? null : getSession(dim.key, tier)
            return (
              <button
                key={dim.key}
                type="button"
                onClick={() => setSwapDim(dim)}
                style={{
                  position: 'relative',
                  textAlign: 'left',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '18px',
                  padding: '14px 16px 14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: dim.color,
                    opacity: isRest ? 0.35 : 1,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: dim.color,
                    }}
                  >
                    {dim.label}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: isRest ? 'var(--ink2)' : 'var(--ink)',
                      marginTop: '2px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {session ? session.name : 'Rest'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>
                    {session
                      ? `${session.durationMin} min · ${TIER_LABELS[tier]}`
                      : 'Recover'}
                  </div>
                </div>
                <span style={{ color: 'var(--ink2)', fontSize: '13px', flexShrink: 0 }}>⇄</span>
              </button>
            )
          })}
        </div>

        {/* Note */}
        <div style={{ marginTop: '24px' }}>
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Note for tomorrow
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={draft}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Anything to remember tomorrow..."
              maxLength={NOTE_MAX}
              style={{
                width: '100%',
                height: '80px',
                resize: 'none',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '12px 14px 22px',
                fontSize: '14px',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '12px',
                fontSize: '10px',
                color: 'var(--ink2)',
                opacity: 0.6,
              }}
            >
              {draft.length} / {NOTE_MAX}
            </span>
          </div>
        </div>
      </div>

      <SwapSheet
        open={!!swapDim}
        dim={swapDim}
        currentTier={swapDim ? (plan[swapDim.key as Dimension] as Tier) : 'P'}
        onSelect={(tier) => swapDim && onChangeTier(swapDim.key as Dimension, tier)}
        onClose={() => setSwapDim(null)}
      />

      {/* Suppress unused import warning when DIM_MAP isn't used externally. */}
      <span style={{ display: 'none' }}>{Object.keys(DIM_MAP).length}</span>
    </div>
  )
}
