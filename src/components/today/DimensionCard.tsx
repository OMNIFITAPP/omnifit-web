import { forwardRef, type CSSProperties } from 'react'
import type { DimConfig, Tier } from '../../types'
import { getSession } from '../../data/sessions'
import { TimeOfDayIcon } from './TimeOfDayIcon'

interface DimensionCardProps {
  dim: DimConfig
  tier: Tier
  checked: boolean
  dayComplete: boolean
  allowSwap?: boolean
  /** When true, card is rendered at 0.5 opacity (e.g. Rest-state readiness). */
  greyed?: boolean
  /** Additional style applied to the root (used by drag layers). */
  dragStyle?: CSSProperties
  /** Drag handle listeners from dnd-kit — attached to the whole card. */
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
  onOpenDetail: () => void
  onOpenSwap: () => void
  onToggleCheck: () => void
}

export const DimensionCard = forwardRef<HTMLDivElement, DimensionCardProps>(function DimensionCard({
  dim,
  tier,
  checked,
  dayComplete,
  allowSwap = true,
  greyed = false,
  dragStyle,
  dragHandleProps,
  isDragging,
  onOpenDetail,
  onOpenSwap,
  onToggleCheck,
}, ref) {
  const isRest = tier === 'R'
  const soft = checked || dayComplete
  const baseOpacity = greyed ? 0.5 : soft ? 0.65 : 1

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
    opacity: isDragging ? 0.95 : baseOpacity,
    overflow: 'hidden',
    transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
    transform: isDragging ? 'scale(1.02)' : undefined,
    boxShadow: isDragging ? '0 8px 24px rgba(61, 40, 23, 0.18)' : undefined,
    touchAction: isDragging ? 'none' : 'manipulation',
    ...dragStyle,
  }

  if (isRest) {
    return (
      <div ref={ref} style={cardStyle} {...(dragHandleProps ?? {})}>
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
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <TimeOfDayIcon dim={dim.key} />
            <span style={{ marginLeft: '6px' }}>{dim.label}</span>
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
      ref={ref}
      style={cardStyle}
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      {...(dragHandleProps ?? {})}
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
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <TimeOfDayIcon dim={dim.key} />
          <span style={{ marginLeft: '6px' }}>{dim.label}</span>
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
})
