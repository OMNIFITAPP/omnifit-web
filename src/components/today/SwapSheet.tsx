import type { DimConfig, Tier } from '../../types'
import { BottomSheet } from '../layout/BottomSheet'
import { getSession, TIER_DESCRIPTIONS } from '../../data/sessions'

interface SwapSheetProps {
  open: boolean
  dim: DimConfig | null
  currentTier: Tier
  onSelect: (tier: Tier) => void
  onClose: () => void
}

const OPTIONS: Array<{ tier: 'P' | 'S' | 'M'; label: string }> = [
  { tier: 'P', label: 'Primary' },
  { tier: 'S', label: 'Secondary' },
  { tier: 'M', label: 'Micro' },
]

export function SwapSheet({ open, dim, currentTier, onSelect, onClose }: SwapSheetProps) {
  if (!dim) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div />
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={dim.label}
      title="Swap today's session"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {OPTIONS.map((opt) => {
          const s = getSession(dim.key, opt.tier)
          const active = currentTier === opt.tier
          return (
            <button
              key={opt.tier}
              type="button"
              onClick={() => {
                onSelect(opt.tier)
                onClose()
              }}
              style={{
                textAlign: 'left',
                background: active ? 'var(--rose)' : 'var(--card)',
                border: `1px solid ${active ? dim.color : 'var(--line)'}`,
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
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
                  {opt.label} · {s.durationMin} min
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginTop: '2px',
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>
                  {TIER_DESCRIPTIONS[opt.tier]}
                </div>
              </div>
              {active && (
                <span
                  aria-hidden
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => {
            onSelect('R')
            onClose()
          }}
          style={{
            textAlign: 'left',
            background: 'transparent',
            border: `1px dashed var(--line)`,
            borderRadius: '14px',
            padding: '12px 16px',
            cursor: 'pointer',
            color: 'var(--ink2)',
            fontSize: '13px',
            marginTop: '4px',
          }}
        >
          Rest today — skip this dimension
        </button>
      </div>
    </BottomSheet>
  )
}
