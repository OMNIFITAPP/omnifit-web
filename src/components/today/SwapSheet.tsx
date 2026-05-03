import type { DimConfig, Tier } from '../../types'
import { BottomSheet } from '../layout/BottomSheet'
import { getSession, getPool, TIER_DESCRIPTIONS } from '../../data/sessions'
import { useDailyPickStore, effectivePickFor } from '../../store/dailyPickStore'

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
  // Subscribe so the active-marker updates after a manual pick.
  useDailyPickStore((s) => s.manual)

  if (!dim) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div />
      </BottomSheet>
    )
  }

  // Build alternative-session list for the active tier (skip if Rest).
  const tierForAlts: 'P' | 'S' | 'M' | null =
    currentTier === 'R' ? null : (currentTier as 'P' | 'S' | 'M')
  const activeId = tierForAlts ? effectivePickFor(dim.key, tierForAlts) : null
  const alternatives = tierForAlts
    ? getPool(dim.key, tierForAlts).filter((s) => s.id !== activeId)
    : []

  function pickSession(sessionId: string) {
    if (!tierForAlts) return
    useDailyPickStore.getState().setManual(dim!.key, tierForAlts, sessionId)
    onClose()
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

        {/* Pool alternatives within the active tier */}
        {alternatives.length > 0 && tierForAlts && (
          <>
            <div
              style={{
                marginTop: '14px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink2)',
              }}
            >
              Other {OPTIONS.find((o) => o.tier === tierForAlts)?.label.toLowerCase()} sessions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {alternatives.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSession(s.id)}
                  style={{
                    textAlign: 'left',
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink2)', marginTop: '2px' }}>
                    {s.durationMin} min · {s.category}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
