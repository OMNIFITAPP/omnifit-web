import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIMS } from '../data/dims'
import { useUserStore } from '../store/userStore'
import { useTodayStore } from '../store/todayStore'
import { useWeekStore } from '../store/weekStore'
import {
  useReadinessCheckinStore,
  shortCoaching,
} from '../store/readinessCheckinStore'
import { fmtDate, greet, greetDone } from '../data/greetings'
import { followPlanFor, planSubtitle } from '../data/followPlan'
import { DimensionCardList } from '../components/today/DimensionCardList'
import { SwapSheet } from '../components/today/SwapSheet'
import { DailyQuote } from '../components/today/DailyQuote'
import { ReadinessCheckinCard } from '../components/today/ReadinessCheckinCard'
import { ReadinessCheckinFlow } from '../components/today/ReadinessCheckinFlow'
import { PlanTomorrowOverlay } from '../components/today/PlanTomorrowOverlay'
import { useDailyNotesStore } from '../store/dailyNotesStore'
import { computeTrial } from '../lib/trial'
import type { DimConfig, Tier, Dimension, DailyPlan } from '../types'

// Map check-in state → desired tier for non-rest dims (Follow mode only).
function adjustPlanForState(plan: DailyPlan, state: string | undefined): DailyPlan {
  if (!state || state === 'Rest is the move') return plan
  const target: Tier =
    state === 'Ready'    ? 'P' :
    state === 'Balanced' ? 'S' :
    state === 'Low'      ? 'M' : 'S'
  const next = {} as DailyPlan
  for (const k of Object.keys(plan) as Dimension[]) {
    next[k] = plan[k] === 'R' ? 'R' : target
  }
  return next
}

export function TodayScreen() {
  const navigate = useNavigate()
  const name = useUserStore((s) => s.name)
  const subscriptionStatus = useUserStore((s) => s.subscriptionStatus)
  const trialStartedAt = useUserStore((s) => s.trialStartedAt)
  const followMode = useUserStore((s) => s.followMode)
  const setFollowMode = useUserStore((s) => s.setFollowMode)
  const activeDims = useUserStore((s) => s.activeDims)
  const focusDim = useUserStore((s) => s.focusDim)
  const orderPreference = useUserStore((s) => s.orderPreference)
  const setOrderPreference = useUserStore((s) => s.setOrderPreference)

  const plan = useTodayStore((s) => s.plan)
  const checked = useTodayStore((s) => s.checked)
  const setTier = useTodayStore((s) => s.setTier)
  const toggleChecked = useTodayStore((s) => s.toggleChecked)
  const ensureFreshDay = useTodayStore((s) => s.ensureFreshDay)

  const todayCheckin = useReadinessCheckinStore((s) => s.today)
  const ensureFreshCheckin = useReadinessCheckinStore((s) => s.ensureFreshDay)
  const loadCheckinFromServer = useReadinessCheckinStore((s) => s.loadFromServer)

  const [swapDim, setSwapDim] = useState<DimConfig | null>(null)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [tomorrowOpen, setTomorrowOpen] = useState(false)

  // Daily notes — show "Note from yesterday" on Today (the note row whose
  // date is today was authored last night during Plan Tomorrow).
  const todayISO = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString().split('T')[0]
  const yesterdayNote = useDailyNotesStore((s) => s.notes[todayISO])
  const loadNotes = useDailyNotesStore((s) => s.loadFor)

  useEffect(() => { ensureFreshDay() }, [ensureFreshDay])
  useEffect(() => { ensureFreshCheckin() }, [ensureFreshCheckin])
  useEffect(() => { loadCheckinFromServer() }, [loadCheckinFromServer])
  useEffect(() => { loadNotes([todayISO]) }, [loadNotes, todayISO])

  const basePlan: DailyPlan = followMode
    ? followPlanFor(focusDim, activeDims)
    : plan

  // Only adjust tiers in Follow mode. Rest state keeps base plan but greys cards.
  const effectivePlan: DailyPlan =
    followMode && todayCheckin ? adjustPlanForState(basePlan, todayCheckin.state) : basePlan

  // Ordered + active dim list respecting user drag-reorder preference.
  const visibleDims: DimConfig[] = useMemo(() => {
    const order = orderPreference ?? DIMS.map((d) => d.key as Dimension)
    const byKey = Object.fromEntries(DIMS.map((d) => [d.key, d]))
    return order
      .filter((k) => activeDims.includes(k))
      .map((k) => byKey[k])
      .filter(Boolean) as DimConfig[]
  }, [orderPreference, activeDims])

  const practiceableDims = visibleDims.filter((d) => effectivePlan[d.key as Dimension] !== 'R')
  const dayComplete =
    practiceableDims.length > 0 &&
    practiceableDims.every((d) => checked[d.key as Dimension])

  const g = dayComplete ? greetDone(name) : greet(name)
  const subtitle = dayComplete ? g.s : planSubtitle(effectivePlan, activeDims)
  const trial = subscriptionStatus === 'trial' ? computeTrial(trialStartedAt) : null

  const isRestDay = todayCheckin?.state === 'Rest is the move'
  const greyAll = !!isRestDay

  // Tomorrow preview — same compute as Today's followPlan, one day ahead.
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowISO = new Date(
    tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()
  ).toISOString().split('T')[0]
  const tomorrowPlan = followPlanFor(focusDim, activeDims, tomorrow)
  const tomorrowSubtitle = planSubtitle(tomorrowPlan, activeDims, tomorrow)
  const weekOverride = useWeekStore((s) => s.plans[tomorrowISO])
  const setDayTier = useWeekStore((s) => s.setDayTier)
  const effectiveTomorrowPlan = weekOverride ?? tomorrowPlan

  function handleReorder(order: Dimension[]) {
    // Preserve unknown dims (future-proof) by appending any not in reorder.
    const allKeys = DIMS.map((d) => d.key as Dimension)
    const merged = [...order, ...allKeys.filter((k) => !order.includes(k))]
    setOrderPreference(merged)
  }

  return (
    <div style={{ padding: '16px 20px 12px' }}>
      {/* Hero */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--ink2)',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {fmtDate()}
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginTop: '4px',
            color: 'var(--ink)',
          }}
        >
          {g.g}
        </h1>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--ink2)',
            fontStyle: 'italic',
            fontWeight: 300,
            marginTop: '3px',
          }}
        >
          {subtitle}
        </div>
        {trial && !trial.expired && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '10px',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              background: 'var(--rose)',
              padding: '5px 10px',
              borderRadius: '999px',
            }}
          >
            Trial · {trial.daysLeft} {trial.daysLeft === 1 ? 'day' : 'days'} left
          </div>
        )}
      </div>

      {/* Readiness check-in */}
      <div style={{ marginBottom: '14px' }}>
        <ReadinessCheckinCard
          checkin={todayCheckin}
          onBegin={() => setCheckinOpen(true)}
          onRecheck={() => setCheckinOpen(true)}
        />
      </div>

      {/* Note from yesterday — quiet rose card, only when content is present */}
      {yesterdayNote && yesterdayNote.trim().length > 0 && (
        <div
          style={{
            background: 'color-mix(in oklab, var(--rose) 60%, transparent)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
            }}
          >
            Note from yesterday
          </div>
          <p
            style={{
              fontSize: '14px',
              fontStyle: 'italic',
              color: 'var(--ink)',
              margin: '4px 0 0',
              lineHeight: 1.5,
            }}
          >
            {yesterdayNote}
          </p>
        </div>
      )}

      {/* Follow / Choose toggle */}
      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '3px',
          gap: '3px',
          marginBottom: '16px',
          width: '176px',
        }}
      >
        {(['follow', 'choose'] as const).map((mode) => {
          const active = mode === 'follow' ? followMode : !followMode
          return (
            <button
              key={mode}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setFollowMode(mode === 'follow')}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '7px 4px',
                borderRadius: '9px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
              }}
            >
              {mode === 'follow' ? 'Follow' : 'Choose'}
            </button>
          )
        })}
      </div>

      {/* Rest banner (Follow mode, Rest state) — cards stay visible, greyed */}
      {isRestDay && followMode && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink2)',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: '10px',
          }}
        >
          Today reads: Rest. The wave benefits from stillness.
        </div>
      )}

      {/* Choose mode note when a check-in exists */}
      {!followMode && todayCheckin && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink2)',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: '10px',
          }}
        >
          Today reads {todayCheckin.state}. {shortCoaching(todayCheckin.state)}
        </div>
      )}

      {/* Dimension cards */}
      <DimensionCardList
        items={visibleDims}
        plan={effectivePlan as Record<Dimension, Tier>}
        checked={checked}
        dayComplete={dayComplete}
        allowSwap={!followMode}
        greyAll={greyAll}
        onOpenDetail={(k) => {
          const t = effectivePlan[k]
          if (t !== 'R') navigate(`/session/${k}/${t}`)
        }}
        onOpenSwap={(dim) => setSwapDim(dim)}
        onToggleCheck={(k) => toggleChecked(k)}
        onReorder={handleReorder}
      />

      {/* Plan tomorrow card — tap anywhere to open full-screen overlay */}
      {dayComplete && (
        <button
          type="button"
          onClick={() => setTomorrowOpen(true)}
          style={{
            width: '100%',
            textAlign: 'left',
            marginTop: '14px',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: '18px',
            padding: '14px 16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'var(--ink)',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
            }}
          >
            Tomorrow
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--ink)',
              marginTop: '4px',
              lineHeight: 1.45,
              fontStyle: 'italic',
            }}
          >
            {tomorrowSubtitle}
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--ink)',
              fontWeight: 600,
            }}
          >
            Plan tomorrow →
          </div>
        </button>
      )}

      <DailyQuote />

      <SwapSheet
        open={!!swapDim}
        dim={swapDim}
        currentTier={swapDim ? (effectivePlan[swapDim.key as Dimension] as Tier) : 'P'}
        onSelect={(tier) => swapDim && setTier(swapDim.key as Dimension, tier)}
        onClose={() => setSwapDim(null)}
      />

      <PlanTomorrowOverlay
        open={tomorrowOpen}
        onClose={() => setTomorrowOpen(false)}
        date={tomorrowISO}
        plan={effectiveTomorrowPlan}
        onChangeTier={(dim, tier) => setDayTier(tomorrowISO, dim, tier)}
      />

      <ReadinessCheckinFlow
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
      />
    </div>
  )
}
