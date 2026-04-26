import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'
import { useWeekStore } from '../../store/weekStore'
import { followPlanFor } from '../../data/followPlan'
import { isoDate, TIER_WEIGHT } from '../../data/week'
import type { Tier } from '../../types'
import { DaySheet } from './DaySheet'
import { PlanTomorrowOverlay } from '../today/PlanTomorrowOverlay'

interface Props {
  open: boolean
  onClose: () => void
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayCellData {
  date: string
  inMonth: boolean
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  /** Average tier weight per completion (0..3). 0 = no data / no completions. */
  load: number
  completionCount: number
  /** Future cell: planned tier mean weight (0..3) from week plan or follow plan. */
  plannedLoad: number
  allComplete: boolean
}

function buildMonthGrid(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  // Monday-anchored grid offset
  const dow = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - dow)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function MonthlyCalendar({ open, onClose }: Props) {
  const navigate = useNavigate()
  const userId = useUserStore((s) => s.userId)
  const focusDim = useUserStore((s) => s.focusDim)
  const activeDims = useUserStore((s) => s.activeDims)
  const weekOverrides = useWeekStore((s) => s.plans)
  const setDayTier = useWeekStore((s) => s.setDayTier)

  const [anchor, setAnchor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [completionsByDate, setCompletionsByDate] =
    useState<Record<string, Array<{ tier: Tier; dimension: string }>>>({})
  const [dayPickedISO, setDayPickedISO] = useState<string | null>(null)
  const [planISO, setPlanISO] = useState<string | null>(null)

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor])
  const todayISO = isoDate(new Date())

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
    ;(async () => {
      try {
        const { data } = await supabase
          .from('session_completions')
          .select('completed_at, tier, dimension')
          .eq('user_id', userId)
          .gte('completed_at', monthStart.toISOString())
          .lt('completed_at', monthEnd.toISOString())
        if (cancelled || !data) return
        const map: Record<string, Array<{ tier: Tier; dimension: string }>> = {}
        for (const row of data as Array<{ completed_at: string; tier: Tier; dimension: string }>) {
          const d = new Date(row.completed_at)
          const key = isoDate(d)
          map[key] = map[key] ?? []
          map[key].push({ tier: row.tier, dimension: row.dimension })
        }
        setCompletionsByDate(map)
      } catch {
        /* offline */
      }
    })()
    return () => { cancelled = true }
  }, [open, userId, anchor])

  if (!open) return null

  const cells: DayCellData[] = grid.map((d) => {
    const date = isoDate(d)
    const inMonth = d.getMonth() === anchor.getMonth()
    const isToday = date === todayISO
    const isPast = date < todayISO
    const isFuture = date > todayISO

    // Past + today: load from completions if present
    const completions = completionsByDate[date] ?? []
    const completionCount = completions.length
    const sumWeight = completions.reduce((s, c) => s + (TIER_WEIGHT[c.tier] ?? 0), 0)
    const load = completionCount > 0 ? sumWeight / completionCount : 0

    // Future: planned tiers from week override or default follow plan
    let plannedLoad = 0
    if (isFuture) {
      const override = weekOverrides[date]
      const plan = override ?? followPlanFor(focusDim, activeDims, d)
      const tiers = (Object.values(plan) as Tier[])
      const w = tiers.reduce((s, t) => s + (TIER_WEIGHT[t] ?? 0), 0)
      plannedLoad = tiers.length > 0 ? w / tiers.length : 0
    }

    const allComplete = completionCount >= activeDims.length

    return { date, inMonth, isToday, isPast, isFuture, load, completionCount, plannedLoad, allComplete }
  })

  function navMonth(delta: number) {
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1))
  }

  function handleCellTap(c: DayCellData) {
    if (c.isToday) {
      onClose()
      navigate('/')
      return
    }
    if (c.isPast) {
      setDayPickedISO(c.date)
    } else if (c.isFuture) {
      setPlanISO(c.date)
    }
  }

  // Color coding per spec
  function cellStyle(c: DayCellData): React.CSSProperties {
    const base: React.CSSProperties = {
      aspectRatio: '1',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      cursor: c.inMonth ? 'pointer' : 'default',
      border: '1px solid transparent',
      background: 'transparent',
      fontFamily: 'inherit',
      color: 'var(--ink)',
      opacity: c.inMonth ? 1 : 0.25,
      position: 'relative',
    }
    // Today outline
    if (c.isToday) {
      base.border = '1.5px solid var(--ink)'
    } else {
      base.border = '1px solid var(--line)'
    }

    if (c.isFuture) {
      // Plan-based shading
      if (c.plannedLoad >= 2.5) {
        base.background = 'color-mix(in oklab, var(--physical) 60%, transparent)'
      } else if (c.plannedLoad >= 2) {
        base.background = 'color-mix(in oklab, var(--physical) 30%, transparent)'
      } else if (c.plannedLoad >= 1.5) {
        base.background = 'color-mix(in oklab, var(--rose) 70%, transparent)'
      } else if (c.plannedLoad >= 1) {
        base.background = 'color-mix(in oklab, var(--rose) 40%, transparent)'
      } else if (c.plannedLoad === 0) {
        base.background = 'var(--card)'
      } else {
        base.border = '1px solid var(--line)'
      }
      return base
    }

    if (c.isPast || c.isToday) {
      const load = c.load
      if (c.completionCount === 0) {
        base.background = 'transparent'
      } else if (load >= 2.5) {
        base.background = 'color-mix(in oklab, var(--physical) 60%, transparent)'
      } else if (load >= 2) {
        base.background = 'color-mix(in oklab, var(--physical) 30%, transparent)'
      } else if (load >= 1.5) {
        base.background = 'color-mix(in oklab, var(--rose) 70%, transparent)'
      } else if (load >= 1) {
        base.background = 'color-mix(in oklab, var(--rose) 40%, transparent)'
      } else {
        base.background = 'var(--card)'
      }
    }
    return base
  }

  // Build a synthetic plan for the picked past date (read-only). For future,
  // PlanTomorrowOverlay handles real editing via weekStore.
  const pickedPlan = useMemo(() => {
    if (!dayPickedISO) return null
    // Use override if any, else seedPlanFor (deterministic past).
    const override = weekOverrides[dayPickedISO]
    if (override) return override
    // For past date, fabricate a plan from any completions to show what was done.
    // If none, use followPlan as best guess.
    const completions = completionsByDate[dayPickedISO] ?? []
    if (completions.length === 0) {
      const d = new Date(`${dayPickedISO}T00:00:00`)
      return followPlanFor(focusDim, activeDims, d)
    }
    const plan = { neuro: 'R', physical: 'R', cognitive: 'R', emotional: 'R' } as Record<string, Tier>
    for (const c of completions) {
      plan[c.dimension] = c.tier
    }
    return plan as never
  }, [dayPickedISO, weekOverrides, completionsByDate, focusDim, activeDims])

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cream)',
        zIndex: 250,
        maxWidth: '430px',
        marginInline: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => navMonth(-1)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--ink2)',
              cursor: 'pointer',
              padding: '4px 8px',
              fontFamily: 'inherit',
            }}
          >
            ‹
          </button>
          <div
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
              minWidth: '140px',
              textAlign: 'center',
            }}
          >
            {anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => navMonth(1)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--ink2)',
              cursor: 'pointer',
              padding: '4px 8px',
              fontFamily: 'inherit',
            }}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          aria-label="Close calendar"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '22px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px 36px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink2)',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {cells.map((c) => (
            <button
              key={c.date}
              type="button"
              onClick={() => handleCellTap(c)}
              disabled={!c.inMonth}
              style={cellStyle(c)}
            >
              <span style={{ fontSize: '12px', fontWeight: c.isToday ? 700 : 500 }}>
                {new Date(`${c.date}T00:00:00`).getDate()}
              </span>
              {c.allComplete && (
                <span
                  aria-hidden
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--ink)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <DaySheet
        open={!!dayPickedISO}
        onClose={() => setDayPickedISO(null)}
        date={dayPickedISO}
        label={dayPickedISO ? new Date(`${dayPickedISO}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }) : ''}
        plan={(pickedPlan ?? { neuro: 'M', physical: 'M', cognitive: 'M', emotional: 'M' }) as never}
        readOnly
        onChangeTier={() => {}}
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
    </div>
  )
}
