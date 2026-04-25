import type { Checkin } from '../../store/readinessCheckinStore'
import { shortCoaching, coachingLine } from '../../store/readinessCheckinStore'

interface Props {
  checkin: Checkin | null
  onBegin: () => void
  onRecheck: () => void
}

const EYEBROW: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink2)',
}

export function ReadinessCheckinCard({ checkin, onBegin, onRecheck }: Props) {
  if (!checkin) {
    return (
      <button
        type="button"
        onClick={onBegin}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'var(--rose)',
          border: 'none',
          borderRadius: '20px',
          padding: '16px 18px 14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: 'var(--ink)',
        }}
      >
        <div style={EYEBROW}>Check in</div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            marginTop: '4px',
            lineHeight: 1.2,
          }}
        >
          Check in with yourself
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '4px' }}>
          30 seconds · informs today's readiness
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink)',
            marginTop: '10px',
            fontWeight: 600,
          }}
        >
          Begin check-in →
        </div>
      </button>
    )
  }

  const longLine = coachingLine(checkin.state)
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        padding: '14px 18px 14px',
      }}
    >
      <div style={EYEBROW}>Today</div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          marginTop: '4px',
          lineHeight: 1.2,
          color: 'var(--ink)',
        }}
      >
        Today reads: {checkin.state}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--ink2)',
          marginTop: '4px',
          lineHeight: 1.45,
          maxWidth: 'calc(100% - 60px)',
        }}
      >
        {longLine}
      </div>
      <button
        type="button"
        onClick={onRecheck}
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          background: 'none',
          border: 'none',
          color: 'var(--ink2)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textDecoration: 'underline',
          padding: '4px 2px',
        }}
      >
        Re-check
      </button>
      <span style={{ display: 'none' }}>{shortCoaching(checkin.state)}</span>
    </div>
  )
}
