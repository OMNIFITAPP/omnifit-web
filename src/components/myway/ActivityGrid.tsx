import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { useWeekStore } from '../../store/weekStore'
import { isoDate } from '../../data/week'
import { followPlanFor } from '../../data/followPlan'
import type { Tier } from '../../types'
import { DaySheet } from './DaySheet'
import { PlanTomorrowOverlay } from '../today/PlanTomorrowOverlay'

const TIER_WEIGHT: Record<string, number> = { P: 3, S: 2, M: 1 }
const COLS_BY_VIEW = { month: 5, quarter: 13, year: 52 } as const
const SQ_BY_VIEW   = { month: 28, quarter: 18, year: 6 } as const
const GAP_BY_VIEW  = { month: 4,  quarter: 3,  year: 1 } as const
type View = keyof typeof COLS_BY_VIEW

const MONTH_SHORT  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LETTER = ['J',   'F',   'M',   'A',   'M',   'J',   'J',   'A',   'S',   'O',   'N',   'D'  ]

/** Monday-anchored start of the week containing `d`. */
function mondayOf(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (out.getDay() + 6) % 7
  out.setDate(out.getDate() - dow)
  return out
}

/** Build an array of N columns × 7 rows of dates, ending with the column that contains today. */
function buildColumns(view: View, today: Date): Date[][] {
  const cols = COLS_BY_VIEW[view]
  const endMonday = mondayOf(today)
  const startMonday = new Date(endMonday)
  startMonday.setDate(endMonday.getDate() - 7 * (cols - 1))

  return Array.from({ length: cols }, (_, c) => {
    const colMonday = new Date(startMonday)
    colMonday.setDate(startMonday.getDate() + c * 7)
    return Array.from({ length: 7 }, (_, r) => {
      const d = new Date(colMonday)
      d.setDate(colMonday.getDate() + r)
      return d
    })
  })
}

/** Current calendar season (Northern hemisphere). */
function currentSeason(d: Date): { name: string; year: number; startMonthDate: Date } {
  const m = d.getMonth()
  const y = d.getFullYear()
  if (m >= 2 && m <= 4)  return { name: 'Spring', year: y, startMonthDate: new Date(y, 2, 1) }
  if (m >= 5 && m <= 7)  return { name: 'Summer', year: y, startMonthDate: new Date(y, 5, 1) }
  if (m >= 8 && m <= 10) return { name: 'Autumn', year: y, startMonthDate: new Date(y, 8, 1) }
  if (m === 11)          return { name: 'Winter', year: y, startMonthDate: new Date(y, 11, 1) }
  // Jan/Feb — winter that began the previous December
  return { name: 'Winter', year: y, startMonthDate: new Date(y - 1, 11, 1) }
}

/** Week-columns from the Monday on/before the season's first day, through the
 *  week containing today. */
function buildSeasonColumns(seasonStart: Date, today: Date): Date[][] {
  const start = mondayOf(seasonStart)
  const end = mondayOf(today)
  const weeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 864e5)) + 1)
  return Array.from({ length: weeks }, (_, c) => {
    const colMonday = new Date(start)
    colMonday.setDate(start.getDate() + c * 7)
    return Array.from({ length: 7 }, (_, r) => {
      const d = new Date(colMonday)
      d.setDate(colMonday.getDate() + r)
      return d
    })
  })
}

/** Choose ink opacity for a given day's intensity. */
function opacityFor(weightSum: number): number | null {
  if (weightSum <= 0) return null            // empty cell — render with border/card bg
  if (weightSum <= 2) return 0.20
  if (weightSum <= 4) return 0.40
  if (weightSum <= 7) return 0.65
  return 1
}

interface ActivityGridProps {
  /** 'season' = the Progress card (fixed current-season grid, no toggle).
   *  'toggle' = inside the calendar modal (Month/Quarter/Year toggle). */
  variant?: 'season' | 'toggle'
  onOpenCalendar?: () => void
}

export function ActivityGrid({ variant = 'season', onOpenCalendar }: ActivityGridProps = {}) {
  const userId = useUserStore((s) => s.userId)
  const focusDim = useUserStore((s) => s.focusDim)
  const activeDims = useUserStore((s) => s.activeDims)
  const weekOverrides = useWeekStore((s) => s.plans)
  const setDayTier = useWeekStore((s) => s.setDayTier)

  // Toggle variant defaults to Quarter (continuous with the season card).
  const [view, setView] = useState<View>('quarter')
  const [intensity, setIntensity] = useState<Record<string, number>>({})
  const [dayPickedISO, setDayPickedISO] = useState<string | null>(null)
  const [planISO, setPlanISO] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayISO = isoDate(today)
  const season = useMemo(() => currentSeason(today), [today])
  const columns = useMemo(
    () => variant === 'season'
      ? buildSeasonColumns(season.startMonthDate, today)
      : buildColumns(view, today),
    [variant, view, today, season],
  )
  // Season grid uses quarter-density cells; toggle grid uses per-view sizing.
  const sizingView: View = variant === 'season' ? 'quarter' : view

  // Window bounds — first cell of column 0, last cell of last column.
  const windowStart = columns[0][0]
  const windowEnd = columns[columns.length - 1][6]

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('session_completions')
      .select('tier, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', windowStart.toISOString())
      .lt('completed_at', new Date(windowEnd.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[ActivityGrid] session_completions error', error)
          return
        }
        const next: Record<string, number> = {}
        for (const row of (data ?? []) as Array<{ tier: Tier; completed_at: string }>) {
          const key = isoDate(new Date(row.completed_at))
          next[key] = (next[key] ?? 0) + (TIER_WEIGHT[row.tier] ?? 0)
        }
        setIntensity(next)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, view, variant])

  // Month labels — emit at the column where a new month begins. Year view uses
  // single-letter labels (12 across 52 narrow columns); season/quarter/month
  // use 3-letter abbreviations.
  const labelTable = sizingView === 'year' ? MONTH_LETTER : MONTH_SHORT
  const monthLabels: Array<{ col: number; label: string }> = []
  let lastMonth = -1
  for (let c = 0; c < columns.length; c++) {
    const m = columns[c][0].getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ col: c, label: labelTable[m] })
      lastMonth = m
    }
  }
  // Toggle/Month view shows one centered current-month label.
  const centeredSingleLabel = variant === 'toggle' && view === 'month'
    ? today.toLocaleDateString('en-US', { month: 'long' })
    : null

  function handleCellTap(d: Date) {
    const iso = isoDate(d)
    if (iso === todayISO || iso < todayISO) {
      setDayPickedISO(iso)
    } else {
      setPlanISO(iso)
    }
  }

  const sq = SQ_BY_VIEW[sizingView]
  const gap = GAP_BY_VIEW[sizingView]

  return (
    <section
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        padding: '18px 16px 14px',
      }}
    >
      {/* Header — season eyebrow (card) OR Month/Quarter/Year toggle (modal) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          {variant === 'season'
            ? `${season.name} ${season.year} · Activity`
            : 'Activity'}
        </div>
        {variant === 'toggle' && (
          <div
            role="tablist"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: '10px',
              padding: '2px',
              gap: '2px',
            }}
          >
            {(['month', 'quarter', 'year'] as View[]).map((v) => {
              const active = v === view
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--cream)' : 'var(--ink2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {v === 'month' ? 'Month' : v === 'quarter' ? 'Quarter' : 'Year'}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid — explicit 7 rows × N columns. grid-auto-flow:column fills
          Mon→Sun top-to-bottom, column by column. Children are emitted in
          column-major order to match. Year view scrolls horizontally if the
          52 columns can't fit. */}
      <div
        className="no-scrollbar"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          justifyContent: view === 'year' ? 'flex-start' : 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${sq}px)`,
            gridTemplateColumns: `repeat(${columns.length}, ${sq}px)`,
            gridAutoFlow: 'column',
            columnGap: `${gap}px`,
            rowGap: `${gap}px`,
          }}
        >
          {columns.flatMap((col, c) =>
            col.map((d, r) => {
              const iso = isoDate(d)
              const sum = intensity[iso] ?? 0
              const op = opacityFor(sum)
              const isToday = iso === todayISO
              const cellStyle: React.CSSProperties = {
                width: `${sq}px`,
                height: `${sq}px`,
                aspectRatio: '1 / 1',
                borderRadius: sq <= 8 ? '1px' : '3px',
                cursor: 'pointer',
                border: isToday ? '1.5px solid var(--ink)' : 'none',
                background: op === null
                  ? 'var(--card)'
                  : `color-mix(in oklab, var(--ink) ${Math.round(op * 100)}%, transparent)`,
                boxSizing: 'border-box',
                padding: 0,
                margin: 0,
                fontFamily: 'inherit',
                flexShrink: 0,
              }
              if (op === null && !isToday) {
                cellStyle.border = '1px solid var(--line)'
              }
              return (
                <button
                  key={`${c}-${r}`}
                  type="button"
                  onClick={() => handleCellTap(d)}
                  aria-label={d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  style={cellStyle}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Month labels along the bottom edge */}
      <div
        style={{
          marginTop: '10px',
          fontSize: '10px',
          color: 'var(--ink2)',
          letterSpacing: '0.04em',
          height: '14px',
          position: 'relative',
        }}
      >
        {centeredSingleLabel ? (
          <div style={{ textAlign: 'center' }}>{centeredSingleLabel}</div>
        ) : (
          <div style={{ position: 'relative', height: '14px' }}>
            {monthLabels.map(({ col, label }) => {
              const leftPx = col * (sq + gap)
              return (
                <span
                  key={`${col}-${label}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPx}px`,
                    top: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* View calendar entry — season card only (the modal already IS the calendar) */}
      {variant === 'season' && (
        <button
          type="button"
          onClick={() => onOpenCalendar?.()}
          style={{
            marginTop: '8px',
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--ink2)',
            fontSize: '12px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          View calendar →
        </button>
      )}

      <DaySheet
        open={!!dayPickedISO}
        onClose={() => setDayPickedISO(null)}
        date={dayPickedISO}
        label={dayPickedISO ? new Date(`${dayPickedISO}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
        plan={
          // Editable today, read-only past. For past we don't know the historical plan
          // (followPlanFor approximates by DOW) — that's good enough for now.
          (dayPickedISO
            ? (weekOverrides[dayPickedISO]
                ?? followPlanFor(focusDim, activeDims, new Date(`${dayPickedISO}T00:00:00`)))
            : { neuro: 'M', physical: 'M', cognitive: 'M', emotional: 'M' }) as never
        }
        readOnly={dayPickedISO !== null && dayPickedISO < todayISO}
        onChangeTier={(dim, tier) => {
          if (dayPickedISO) setDayTier(dayPickedISO, dim, tier)
        }}
      />

      <PlanTomorrowOverlay
        open={!!planISO}
        onClose={() => setPlanISO(null)}
        date={planISO ?? todayISO}
        plan={
          planISO
            ? (weekOverrides[planISO] ?? followPlanFor(focusDim, activeDims, new Date(`${planISO}T00:00:00`)))
            : { neuro: 'M', physical: 'M', cognitive: 'M', emotional: 'M' }
        }
        onChangeTier={(dim, tier) => planISO && setDayTier(planISO, dim, tier)}
      />
    </section>
  )
}
