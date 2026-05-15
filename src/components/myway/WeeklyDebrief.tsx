import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { isoDate } from '../../data/week'

const MAX = 280
const SAVE_DEBOUNCE_MS = 800

interface Completion {
  duration_seconds: number | null
  dimension: string
  felt: string | null
}

/** Returns the Monday→Sunday window for the LAST completed week (the one that ended on the most recent Sunday). */
function lastCompletedWeek(today: Date = new Date()): { start: Date; end: Date; startISO: string } {
  // Monday of the current week
  const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dow = (thisMonday.getDay() + 6) % 7
  thisMonday.setDate(thisMonday.getDate() - dow)
  // Previous Monday
  const start = new Date(thisMonday)
  start.setDate(thisMonday.getDate() - 7)
  // Previous Sunday (end inclusive at end-of-day)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end, startISO: isoDate(start) }
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null
  const counts: Record<string, number> = {}
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

export function WeeklyDebrief() {
  const userId = useUserStore((s) => s.userId)
  const [completions, setCompletions] = useState<Completion[] | null>(null)
  const [reflection, setReflection] = useState('')
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const { start, end, startISO } = lastCompletedWeek()

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const completionsPromise = supabase
          .from('session_completions')
          .select('duration_seconds, dimension, felt')
          .eq('user_id', userId)
          .gte('completed_at', start.toISOString())
          .lt('completed_at', end.toISOString())
        const debriefPromise = supabase
          .from('weekly_debriefs')
          .select('reflection')
          .eq('user_id', userId)
          .eq('week_start', startISO)
          .maybeSingle()
        const [c, d] = await Promise.all([completionsPromise, debriefPromise])
        if (cancelled) return
        if (c.error) console.error('[WeeklyDebrief] completions error', c.error)
        setCompletions((c.data ?? []) as Completion[])
        if (d.data?.reflection) setReflection(d.data.reflection as string)
        setLoaded(true)
      } catch (err) {
        console.error('[WeeklyDebrief] load exception', err)
      }
    })()
    return () => { cancelled = true }
  }, [userId, startISO, start, end])

  function handleChange(next: string) {
    const trimmed = next.slice(0, MAX)
    setReflection(trimmed)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      if (!userId) return
      supabase
        .from('weekly_debriefs')
        .upsert(
          { user_id: userId, week_start: startISO, reflection: trimmed },
          { onConflict: 'user_id,week_start' }
        )
        .then(({ error }) => {
          if (error) console.error('[WeeklyDebrief] upsert error', error)
        })
    }, SAVE_DEBOUNCE_MS)
  }

  const lines: string[] = []
  let zeroSessions = false
  if (completions && completions.length === 0) {
    zeroSessions = true
    lines.push('A quiet week. No sessions logged.')
  } else if (completions && completions.length > 0) {
    const distinctDims = new Set(completions.map((c) => c.dimension)).size
    const totalSec = completions.reduce((s, c) => s + (c.duration_seconds ?? 0), 0)
    lines.push(`${completions.length} session${completions.length === 1 ? '' : 's'} across ${distinctDims} ${distinctDims === 1 ? 'dimension' : 'dimensions'}`)
    lines.push(`${Math.round(totalSec / 60)} minutes total`)
    const felts = completions.map((c) => c.felt).filter((f): f is string => !!f)
    const top = mostCommon(felts)
    if (top) lines.push(`Felt ${top} most often`)
  }

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
        Last week
      </div>

      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '14px 16px',
        }}
      >
        {!loaded ? (
          <p style={{ fontSize: '12px', color: 'var(--ink2)', fontStyle: 'italic', margin: 0 }}>
            Loading…
          </p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lines.map((line, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '14px',
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
            {!zeroSessions && (
              <>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--ink2)',
                    marginTop: '14px',
                    marginBottom: '6px',
                  }}
                >
                  Reflect on the week
                </div>
                <textarea
                  value={reflection}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="One sentence is enough."
                  rows={3}
                  maxLength={MAX}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    background: 'var(--cream)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.55,
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    outline: 'none',
                    minHeight: '70px',
                  }}
                />
              </>
            )}
          </>
        )}
      </section>
    </section>
  )
}
