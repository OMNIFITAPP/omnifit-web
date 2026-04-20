import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DIMS } from '../data/dims'
import { useUserStore } from '../store/userStore'
import { useTodayStore } from '../store/todayStore'
import { fmtDate, greet, greetDone } from '../data/greetings'
import { DimensionCard } from '../components/today/DimensionCard'
import { SwapSheet } from '../components/today/SwapSheet'
import { ReadinessSummary } from '../components/today/ReadinessSummary'
import { DailyQuote } from '../components/today/DailyQuote'
import { computeTrial } from '../lib/trial'
import type { DimConfig, Tier, Dimension } from '../types'

export function TodayScreen() {
  const navigate = useNavigate()
  const name = useUserStore((s) => s.name)
  const readiness = useUserStore((s) => s.readiness)
  const subscriptionStatus = useUserStore((s) => s.subscriptionStatus)
  const trialStartedAt = useUserStore((s) => s.trialStartedAt)
  const plan = useTodayStore((s) => s.plan)
  const checked = useTodayStore((s) => s.checked)
  const setTier = useTodayStore((s) => s.setTier)
  const toggleChecked = useTodayStore((s) => s.toggleChecked)
  const ensureFreshDay = useTodayStore((s) => s.ensureFreshDay)

  const [swapDim, setSwapDim] = useState<DimConfig | null>(null)

  useEffect(() => {
    ensureFreshDay()
  }, [ensureFreshDay])

  const activeDims = DIMS.filter((d) => plan[d.key] !== 'R')
  const dayComplete =
    activeDims.length > 0 && activeDims.every((d) => checked[d.key])

  const g = dayComplete ? greetDone(name) : greet(name)
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
          {g.s}
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

      {/* Dimension cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {DIMS.map((dim) => (
          <DimensionCard
            key={dim.key}
            dim={dim}
            tier={plan[dim.key] as Tier}
            checked={checked[dim.key]}
            dayComplete={dayComplete}
            onOpenDetail={() => {
              const t = plan[dim.key]
              if (t !== 'R') navigate(`/session/${dim.key}/${t}`)
            }}
            onOpenSwap={() => setSwapDim(dim)}
            onToggleCheck={() => toggleChecked(dim.key)}
          />
        ))}
      </div>

      <ReadinessSummary scores={readiness} />
      <DailyQuote />

      <SwapSheet
        open={!!swapDim}
        dim={swapDim}
        currentTier={swapDim ? (plan[swapDim.key] as Tier) : 'P'}
        onSelect={(tier) => swapDim && setTier(swapDim.key as Dimension, tier)}
        onClose={() => setSwapDim(null)}
      />
    </div>
  )
}
