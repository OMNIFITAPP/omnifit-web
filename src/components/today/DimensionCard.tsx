import type { DimConfig, Tier } from '../../types'
import { getSession } from '../../data/sessions'

interface DimensionCardProps {
  dim: DimConfig
  tier: Tier
  checked: boolean
  dayComplete: boolean
  allowSwap?: boolean
  onOpenDetail: () => void
  onOpenSwap: () => void
  onToggleCheck: () => void
}

export function DimensionCard({
  dim,
  tier,
  checked,
  dayComplete,
  allowSwap = true,
  onOpenDetail,
  onOpenSwap,
  onToggleCheck,
}: DimensionCardProps) {
  const isRest = tier === 'R'
  const soft = checked || dayComplete

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: 'var(--card)',
    border: '1px solid var(--line)',
    borderRadius: '18px',
    padding: '14px 16px 14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: isRest ? 'default' : 'pointer',
    opacity: soft ? 0.65 : 1,
    overflow: 'hidden',
    transition: 'opacity 0.2s ease',
  }

  if (isRest) {
    return (
      <div style={cardStyle}>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: 'var(--ink2)',
            opacity: 0.35,
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
              color: 'var(--ink2)',
              marginTop: '2px',
            }}
          >
            Rest — not today
          </div>
        </div>
      </div>
    )
  }

  const session = getSession(dim.key, tier)

  return (
    <div
      style={cardStyle}
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
    >
      {/* Accent bar */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: dim.color,
        }}
      />

      {/* Text block */}
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
            color: 'var(--ink)',
            marginTop: '2px',
            letterSpacing: '-0.01em',
          }}
        >
          {session.name}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink2)',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>
            {session.durationMin} min · {session.tierLabel}
          </span>
          {allowSwap && (
            <button
              type="button"
              aria-label="Swap session"
              onClick={(e) => {
                e.stopPropagation()
                onOpenSwap()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                cursor: 'pointer',
                color: 'var(--ink2)',
                fontSize: '13px',
                lineHeight: 1,
              }}
            >
              ⇄
            </button>
          )}
        </div>
      </div>

      {/* Check circle */}
      <button
        type="button"
        aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleCheck()
        }}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: checked ? 'none' : '1.5px solid var(--line)',
          background: checked ? 'var(--ink)' : 'transparent',
          color: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          lineHeight: 1,
          transition: 'background 0.15s ease, border 0.15s ease',
        }}
      >
        {checked ? '✓' : ''}
      </button>
    </div>
  )
}
