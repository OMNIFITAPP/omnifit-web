import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WaveChart, type WaveDay } from './WaveChart'
import { DaySheet } from './DaySheet'
import { CapacityBars } from './CapacityBars'
import { MonthlyStats } from './MonthlyStats'
import { ReadinessSummary } from '../today/ReadinessSummary'
import { ReadinessSheet } from './ReadinessSheet'
import { MonthlyCalendar } from './MonthlyCalendar'
import { useTodayStore } from '../../store/todayStore'
import { useWeekStore } from '../../store/weekStore'
import { useUserStore } from '../../store/userStore'
import { useReadinessCheckinStore } from '../../store/readinessCheckinStore'
import { currentWeek, seedPlanFor, ALL_DONE, dayWeight, weekReading } from '../../data/week'
import type { DailyPlan, Dimension, Tier, CompletionState } from '../../types'

export function ProgressTab() {
  const todayPlan = useTodayStore((s) => s.plan)
  const todayChecked = useTodayStore((s) => s.checked)
  const setTodayTier = useTodayStore((s) => s.setTier)
  const activeDims = useUserStore((s) => s.activeDims)
  const todayCheckin = useReadinessCheckinStore((s) => s.today)
  const navigate = useNavigate()

  const overrides = useWeekStore((s) => s.plans)
  const setDayTier = useWeekStore((s) => s.setDayTier)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [readinessOpen, setReadinessOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const days: WaveDay[] = useMemo(() => {
    return currentWeek().map((d) => {
      let plan: DailyPlan
      let checked: CompletionState
      if (d.isToday) {
        plan = todayPlan
        checked = todayChecked
      } else if (d.isPast) {
        plan = seedPlanFor(d.date)
        checked = ALL_DONE
      } else {
        plan = overrides[d.date] ?? todayPlan
        checked = { neuro: false, physical: false, cognitive: false, emotional: false }
      }
      return { ...d, plan, checked }
    })
  }, [todayPlan, todayChecked, overrides])

  const selected = selectedDate ? days.find((d) => d.date === selectedDate) ?? null : null
  const totals = days.map((d) => dayWeight(d.plan))
  const reading = weekReading(totals)

  function handleChangeTier(dim: Dimension, tier: Tier) {
    if (!selected) return
    if (selected.isPast) return
    if (selected.isToday) setTodayTier(dim, tier)
    else setDayTier(selected.date, dim, tier)
  }

  return (
    <div>
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px 16px 16px',
        }}
      >
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: '0 0 12px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          This week <span aria-hidden style={{ fontSize: '12px' }}>›</span>
        </button>
        <WaveChart days={days} onSelectDay={setSelectedDate} />
        <p
          style={{
            fontSize: '12px',
            color: 'var(--ink2)',
            marginTop: '14px',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {reading}
        </p>
      </section>

      <CapacityBars activeDims={activeDims} />

      {/* Dynamic readiness — composite drives all four ring values */}
      {todayCheckin ? (() => {
        const v = Math.round(((todayCheckin.composite - 4) / 12) * 100)
        const scores = { physical: v, cognitive: v, emotional: v, neuro: v, composite: v }
        return (
          <ReadinessSummary
            scores={scores}
            title="Readiness today"
            onTap={() => setReadinessOpen(true)}
          />
        )
      })() : (
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'var(--rose)',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 18px',
            marginTop: '16px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
            Readiness today
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ink)', marginTop: '6px', lineHeight: 1.45 }}>
            Not checked in. Begin check-in →
          </div>
        </button>
      )}
      <ReadinessSheet open={readinessOpen} onClose={() => setReadinessOpen(false)} />
      <MonthlyCalendar open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <MonthlyStats />

      <DaySheet
        open={!!selected}
        onClose={() => setSelectedDate(null)}
        date={selected?.date ?? null}
        label={selected?.label ?? ''}
        plan={selected?.plan ?? { neuro: 'M', physical: 'M', cognitive: 'M', emotional: 'M' }}
        readOnly={!!selected?.isPast}
        onChangeTier={handleChangeTier}
      />
    </div>
  )
}
