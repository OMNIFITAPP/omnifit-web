import { useEffect, useState } from 'react'
import { DIMS } from '../../data/dims'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { CapacityInfoSheet, InfoIcon } from './CapacityInfoSheet'
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

interface CapacityBarsProps {
  activeDims?: Dimension[]
}

type FeltNotes = Partial<Record<Dimension, string>>

export function CapacityBars({ activeDims }: CapacityBarsProps) {
  const visible = activeDims ? DIMS.filter((d) => activeDims.includes(d.key as Dimension)) : DIMS
  const [feltNotes, setFeltNotes] = useState<FeltNotes>({})
  const [infoDim, setInfoDim] = useState<Dimension | null>(null)
  const [pressedDim, setPressedDim] = useState<Dimension | null>(null)

  useEffect(() => {
    const userId = useUserStore.getState().userId
    if (!userId) return
    let cancelled = false
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('session_completions')
      .select('dimension, felt, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', since)
      .then(({ data }) => {
        if (cancelled || !data) return
        const byDim: Record<string, string[]> = {}
        for (const r of data as Array<{ dimension: string; felt: string | null }>) {
          if (!r.felt) continue
          byDim[r.dimension] = byDim[r.dimension] ?? []
          byDim[r.dimension].push(r.felt)
        }
        const notes: FeltNotes = {}
        for (const [dim, felts] of Object.entries(byDim)) {
          if (felts.length < 3) continue
          const counts: Record<string, number> = {}
          for (const f of felts) counts[f] = (counts[f] ?? 0) + 1
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
          notes[dim as Dimension] = top
        }
        setFeltNotes(notes)
      })
    return () => { cancelled = true }
  }, [])

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
        {visible.map((dim) => {
          const c = CAPACITY[dim.key]
          const up = c.trend > 0
          const flat = c.trend === 0
          const felt = feltNotes[dim.key as Dimension]
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
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {dim.label}
                  <button
                    type="button"
                    aria-label={`About ${dim.label} capacity`}
                    onClick={() => {
                      setPressedDim(dim.key as Dimension)
                      setTimeout(() => {
                        setInfoDim(dim.key as Dimension)
                        setPressedDim(null)
                      }, 120)
                    }}
                    style={{
                      marginLeft: '8px',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--ink2)',
                      opacity: pressedDim === dim.key ? 1 : 0.5,
                      transition: 'opacity 0.15s ease',
                      lineHeight: 0,
                    }}
                  >
                    <InfoIcon />
                  </button>
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
              {felt && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--ink2)',
                    fontStyle: 'italic',
                    marginTop: '6px',
                  }}
                >
                  This dimension has felt {felt} lately.
                </div>
              )}
            </div>
          )
        })}
      </div>
      <CapacityInfoSheet open={!!infoDim} dim={infoDim} onClose={() => setInfoDim(null)} />
    </section>
  )
}
