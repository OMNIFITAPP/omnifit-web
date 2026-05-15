import { useEffect, useMemo, useState } from 'react'
import { DIMS } from '../../data/dims'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { CapacityInfoSheet, InfoIcon } from './CapacityInfoSheet'
import type { Dimension } from '../../types'

const TIER_VALUE: Record<string, number> = { P: 0.5, S: 0.3, M: 0.1 }
const DECAY_PER_DAY = 0.985
const BASELINE = 10
const WINDOW_DAYS = 28

interface DimScore { value: number; trend: number }

/** Score for a single dimension at a given "now" date. */
function computeScore(
  completions: Array<{ tier: string; completed_at: string }>,
  now: Date
): number {
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  let score = BASELINE
  let lastDate = cutoff
  const usable = completions
    .filter((c) => new Date(c.completed_at) >= cutoff && new Date(c.completed_at) <= now)
    .sort((a, b) => +new Date(a.completed_at) - +new Date(b.completed_at))
  for (const c of usable) {
    const at = new Date(c.completed_at)
    const days = (at.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
    score *= Math.pow(DECAY_PER_DAY, days)
    score = Math.min(100, score + (TIER_VALUE[c.tier] ?? 0))
    lastDate = at
  }
  const finalDays = (now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
  score *= Math.pow(DECAY_PER_DAY, finalDays)
  return Math.round(Math.max(0, score))
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
  const [scores, setScores] = useState<Record<Dimension, DimScore>>({
    physical:  { value: BASELINE, trend: 0 },
    cognitive: { value: BASELINE, trend: 0 },
    emotional: { value: BASELINE, trend: 0 },
    neuro:     { value: BASELINE, trend: 0 },
  })
  const userId = useUserStore((s) => s.userId)
  const dismissed = useUserStore((s) => s.capacityExplainedDismissed)
  const setDismissed = useUserStore((s) => s.setCapacityExplainedDismissed)
  const anyDimEarned = useMemo(
    () => Object.values(scores).some((s) => s.value >= 25),
    [scores]
  )
  // Auto-dismiss once any dimension hits 25.
  useEffect(() => {
    if (anyDimEarned && !dismissed && userId) {
      setDismissed(true)
      supabase.from('profiles').update({ capacity_explained_dismissed: true }).eq('id', userId).then(() => {})
    }
  }, [anyDimEarned, dismissed, userId, setDismissed])

  function manualDismiss() {
    setDismissed(true)
    if (userId) {
      supabase.from('profiles').update({ capacity_explained_dismissed: true }).eq('id', userId).then(() => {})
    }
  }
  const showTeaching = !dismissed

  // Compute capacity scores from completions (current + 7-day-ago for trend)
  useEffect(() => {
    const userId = useUserStore.getState().userId
    if (!userId) return
    let cancelled = false
    const now = new Date()
    const since = new Date(now.getTime() - (WINDOW_DAYS + 7) * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('session_completions')
      .select('dimension, tier, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', since)
      .then(({ data }) => {
        if (cancelled || !data) return
        const byDim: Record<string, Array<{ tier: string; completed_at: string }>> = {}
        for (const r of data as Array<{ dimension: string; tier: string; completed_at: string }>) {
          ;(byDim[r.dimension] = byDim[r.dimension] ?? []).push({ tier: r.tier, completed_at: r.completed_at })
        }
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const next = {} as Record<Dimension, DimScore>
        for (const dim of ['physical', 'cognitive', 'emotional', 'neuro'] as Dimension[]) {
          const list = byDim[dim] ?? []
          const cur = computeScore(list, now)
          const prev = computeScore(list, sevenDaysAgo)
          next[dim] = { value: cur, trend: cur - prev }
        }
        setScores(next)
      })
    return () => { cancelled = true }
  }, [])

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

      {showTeaching && (
        <div
          style={{
            position: 'relative',
            background: 'color-mix(in oklab, var(--rose) 50%, transparent)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              marginBottom: '4px',
            }}
          >
            Long view
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
            What you've built over weeks. Moves slowly. Today's state is{' '}
            Readiness — a different thing.
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={manualDismiss}
            style={{
              position: 'absolute',
              top: '8px',
              right: '10px',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--ink2)',
              opacity: 0.5,
              fontSize: '10px',
              fontFamily: 'inherit',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.map((dim) => {
          const c = scores[dim.key as Dimension]
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
