import { DIMS } from '../../data/dims'
import type { Dimension } from '../../types'

// MVP: static values. TODO(v2): replace with Supabase `capacity_scores` table
// fetched per user — returns { dim, value, trend } rows computed from recent
// check-ins, HRV, and completion rate.
const CAPACITY: Record<Dimension, { value: number; trend: number }> = {
  physical:  { value: 72, trend:  3 },
  cognitive: { value: 68, trend:  1 },
  emotional: { value: 64, trend: -2 },
  neuro:     { value: 78, trend:  4 },
}

export function CapacityBars() {
  return (
    <section style={{ marginTop: '20px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          marginBottom: '10px',
        }}
      >
        Capacity
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {DIMS.map((dim) => {
          const c = CAPACITY[dim.key]
          const up = c.trend > 0
          const flat = c.trend === 0
          return (
            <div key={dim.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: dim.color,
                    letterSpacing: '0.02em',
                  }}
                >
                  {dim.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: flat ? 'var(--ink2)' : up ? 'var(--physical)' : 'var(--ink2)',
                      fontWeight: 600,
                    }}
                  >
                    {flat ? '→' : up ? '↑' : '↓'} {up ? '+' : ''}{c.trend}
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                    {c.value}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--line)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${c.value}%`,
                    height: '100%',
                    background: dim.color,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
