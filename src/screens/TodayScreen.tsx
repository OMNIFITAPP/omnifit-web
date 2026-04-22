import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIMS } from '../data/dims'
import { useUserStore } from '../store/userStore'
import { useTodayStore } from '../store/todayStore'
import { fmtDate, greet, greetDone } from '../data/greetings'
import { followPlanFor, planSubtitle } from '../data/followPlan'
import { DimensionCard } from '../components/today/DimensionCard'
import { SwapSheet } from '../components/today/SwapSheet'
import { DailyQuote } from '../components/today/DailyQuote'
import { computeTrial } from '../lib/trial'
import type { DimConfig, Tier, Dimension, DailyPlan } from '../types'

export function TodayScreen() {
  const navigate = useNavigate()
  const name = useUserStore((s) => s.name)
  const subscriptionStatus = useUserStore((s) => s.subscriptionStatus)
  const trialStartedAt = useUserStore((s) => s.trialStartedAt)
  const followMode = useUserStore((s) => s.followMode)
  const setFollowMode = useUserStore((s) => s.setFollowMode)
  const activeDims = useUserStore((s) => s.activeDims)
  const focusDim = useUserStore((s) => s.focusDim)

  const plan = useTodayStore((s) => s.plan)
  const checked = useTodayStore((s) => s.checked)
  const setTier = useTodayStore((s) => s.setTier)
  const toggleChecked = useTodayStore((s) => s.toggleChecked)
  const ensureFreshDay = useTodayStore((s) => s.ensureFreshDay)

  const [swapDim, setSwapDim] = useState<DimConfig | null>(null)

  useEffect(() => {
    ensureFreshDay()
  }, [ensureFreshDay])

  const effectivePlan: DailyPlan = followMode
    ? followPlanFor(focusDim, activeDims)
    : plan

  const visibleDims = DIMS.filter((d) => activeDims.includes(d.key as Dimension))
  const practiceableDims = visibleDims.filter((d) => effectivePlan[d.key as Dimension] !== 'R')
  const dayComplete =
    practiceableDims.length > 0 &&
    practiceableDims.every((d) => checked[d.key as Dimension])

  const g = dayComplete ? greetDone(name) : greet(name)
  const subtitle = dayComplete ? g.s : planSubtitle(effectivePlan, activeDims)
  const trial = subscriptionStatus === 'trial' ? computeTrial(trialStartedAt) : null

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

      {/* Dimension cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleDims.map((dim) => (
          <DimensionCard
            key={dim.key}
            dim={dim}
            tier={effectivePlan[dim.key as Dimension] as Tier}
            checked={checked[dim.key as Dimension]}
            dayComplete={dayComplete}
            allowSwap={!followMode}
            onOpenDetail={() => {
              const t = effectivePlan[dim.key as Dimension]
              if (t !== 'R') navigate(`/session/${dim.key}/${t}`)
            }}
            onOpenSwap={() => setSwapDim(dim)}
            onToggleCheck={() => toggleChecked(dim.key as Dimension)}
          />
        ))}
      </div>

      <DailyQuote />

      <SwapSheet
        open={!!swapDim}
        dim={swapDim}
        currentTier={swapDim ? (effectivePlan[swapDim.key as Dimension] as Tier) : 'P'}
        onSelect={(tier) => swapDim && setTier(swapDim.key as Dimension, tier)}
        onClose={() => setSwapDim(null)}
      />
    </div>
  )
}
