import { useState } from 'react'
import { BottomSheet } from '../layout/BottomSheet'
import { SwapSheet } from '../today/SwapSheet'
import { DIMS } from '../../data/dims'
import { getSession, TIER_LABELS } from '../../data/sessions'
import type { DailyPlan, DimConfig, Tier, Dimension } from '../../types'

interface DaySheetProps {
  open: boolean
  onClose: () => void
  date: string | null
  label: string
  plan: DailyPlan
  readOnly: boolean
  onChangeTier: (dim: Dimension, tier: Tier) => void
}

function formatLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function DaySheet({ open, onClose, date, label, plan, readOnly, onChangeTier }: DaySheetProps) {
  const [swapDim, setSwapDim] = useState<DimConfig | null>(null)

  if (!date) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div />
      </BottomSheet>
    )
  }

  return (
    <>
      <BottomSheet
        open={open && !swapDim}
        onClose={onClose}
        eyebrow={readOnly ? 'History' : label}
        title={formatLong(date)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
          {DIMS.map((dim) => {
            const tier = plan[dim.key] as Tier
            const isRest = tier === 'R'
            const s = isRest ? null : getSession(dim.key, tier)
            return (
              <button
                key={dim.key}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && setSwapDim(dim)}
                style={{
                  textAlign: 'left',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '12px 14px 12px 16px',
                  cursor: readOnly ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: readOnly ? 0.85 : 1,
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
                      fontSize: '10px',
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
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isRest ? 'var(--ink2)' : 'var(--ink)',
                      marginTop: '2px',
                    }}
                  >
                    {s ? s.name : 'Rest'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>
                    {s ? `${s.durationMin} min · ${TIER_LABELS[tier]}` : 'Recover'}
                  </div>
                </div>
                {!readOnly && (
                  <span style={{ color: 'var(--ink2)', fontSize: '13px' }}>⇄</span>
                )}
              </button>
            )
          })}

          {readOnly && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ink2)',
                textAlign: 'center',
                marginTop: '8px',
                fontStyle: 'italic',
              }}
            >
              Past days are read-only.
            </div>
          )}
        </div>
      </BottomSheet>

      <SwapSheet
        open={!!swapDim}
        dim={swapDim}
        currentTier={swapDim ? (plan[swapDim.key] as Tier) : 'P'}
        onSelect={(tier) => swapDim && onChangeTier(swapDim.key, tier)}
        onClose={() => setSwapDim(null)}
      />
    </>
  )
}
