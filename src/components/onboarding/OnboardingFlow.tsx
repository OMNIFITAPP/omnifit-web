import { useState, useCallback } from 'react'
import { useUserStore } from '../../store/userStore'
import { useTodayStore } from '../../store/todayStore'
import { supabase } from '../../lib/supabase'
import type { Dimension } from '../../types'
import { DIMS } from '../../data/dims'

// ─── Tier demo data (slide 3) ────────────────────────────────
const TIER_DEMO: Record<'P' | 'S' | 'M' | 'R', { name: string; meta: string }> = {
  P: { name: 'Reactive Balance Flow', meta: '20 min · Primary' },
  S: { name: 'Cross-Crawl Flow',      meta: '10 min · Secondary' },
  M: { name: 'Posture Reset',         meta: '3 min · Micro' },
  R: { name: 'Rest — not today',      meta: 'Intentional pause' },
}

// ─── Progress dots ───────────────────────────────────────────
function ObDots({ current }: { current: number }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        padding: '20px 0 0',
        flexShrink: 0,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i === current ? 'var(--ink)' : 'var(--line)',
            transition: 'background 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Slide 1: Welcome ────────────────────────────────────────
function WelcomeSlide() {
  return (
    <>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '16px',
        }}
      >
        OMNIFIT
      </div>
      <div
        style={{
          fontSize: '16px',
          lineHeight: 1.65,
          marginBottom: '24px',
          color: 'var(--ink)',
        }}
      >
        An online fitness club built around a daily practice across four
        dimensions — physical, cognitive, emotional, and neurological.
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        Not a workout app. Not a meditation app. Not a brain trainer. All four,
        woven into one day, one week, one life.
      </div>
    </>
  )
}

// ─── Slide 2: Four dimensions ────────────────────────────────
function DimensionsSlide() {
  const dimDescriptions: Record<string, string> = {
    neuro:     'Balance, coordination, reaction, proprioception.',
    physical:  'Strength, mobility, locomotion, endurance.',
    cognitive: 'Attention, memory, learning, executive function.',
    emotional: 'Regulation, resilience, awareness, connection.',
  }

  return (
    <>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '16px',
        }}
      >
        Four dimensions of fitness.
      </div>
      <div
        style={{
          fontSize: '16px',
          lineHeight: 1.65,
          marginBottom: '0',
          color: 'var(--ink)',
        }}
      >
        Fitness is more than the body. OMNIFIT trains four systems, daily.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '24px 0' }}>
        {DIMS.map((dim) => (
          <div key={dim.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: dim.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{dim.label}</div>
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--ink2)',
                marginLeft: '26px',
                marginTop: '-2px',
              }}
            >
              {dimDescriptions[dim.key]}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        Morning to evening. Neurological primer, physical training, cognitive
        work, emotional downshift.
      </div>
    </>
  )
}

// ─── Slide 3: Tiers (interactive) ───────────────────────────
function TiersSlide({
  demoTier,
  setDemoTier,
}: {
  demoTier: 'P' | 'S' | 'M' | 'R'
  setDemoTier: (t: 'P' | 'S' | 'M' | 'R') => void
}) {
  const TIER_BTNS = [
    { key: 'P' as const, label: 'P' },
    { key: 'S' as const, label: 'S' },
    { key: 'M' as const, label: 'M' },
    { key: 'R' as const, label: '—' },
  ]

  return (
    <>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '16px',
        }}
      >
        Every day is adjustable.
      </div>
      <div
        style={{
          fontSize: '16px',
          lineHeight: 1.65,
          color: 'var(--ink)',
        }}
      >
        Each session has three tiers. Choose based on what the day allows.
      </div>

      {/* Interactive demo card */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: '20px',
          padding: '16px 18px',
          border: '1px solid var(--line)',
          margin: '20px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '36px',
              borderRadius: '2px',
              background: 'var(--neurological)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--neurological)',
              }}
            >
              Neurological
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                marginTop: '2px',
                transition: 'opacity 0.15s ease',
              }}
            >
              {TIER_DEMO[demoTier].name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--ink2)',
                marginTop: '1px',
              }}
            >
              {TIER_DEMO[demoTier].meta}
            </div>
          </div>
        </div>

        {/* Tier buttons */}
        <div
          style={{
            display: 'flex',
            gap: '3px',
            marginLeft: '16px',
            background: 'rgba(61,40,23,0.05)',
            borderRadius: '10px',
            padding: '3px',
            width: 'fit-content',
          }}
        >
          {TIER_BTNS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDemoTier(key)}
              style={{
                fontSize: key === 'R' ? '13px' : '10px',
                letterSpacing: '0.08em',
                fontWeight: 700,
                padding: key === 'R' ? '5px 10px' : '5px 11px',
                borderRadius: '7px',
                color: demoTier === key ? 'var(--ink)' : 'var(--ink2)',
                cursor: 'pointer',
                border: 'none',
                background: demoTier === key ? 'var(--card)' : 'none',
                boxShadow: demoTier === key ? '0 1px 3px rgba(61,40,23,0.1)' : 'none',
                fontFamily: 'inherit',
                lineHeight: key === 'R' ? 1 : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>P</strong>
        {' = Primary, full session. '}
        <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>S</strong>
        {' = Secondary, lighter. '}
        <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>M</strong>
        {' = Micro, just minutes. '}
        <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>—</strong>
        {' = Rest, not today.'}
      </div>
    </>
  )
}

// ─── Slide 4: Commitment ─────────────────────────────────────
function CommitmentSlide({
  name,
  why,
  chosenDim,
  onNameChange,
  onWhyChange,
  onDimChange,
}: {
  name: string
  why: string
  chosenDim: Dimension | null
  onNameChange: (v: string) => void
  onWhyChange: (v: string) => void
  onDimChange: (d: Dimension) => void
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid var(--ink2)',
    fontFamily: 'inherit',
    fontSize: '18px',
    fontWeight: 300,
    color: 'var(--ink)',
    padding: '8px 0 6px',
    outline: 'none',
    fontStyle: 'italic',
    width: '100%',
    transition: 'border-color 0.2s ease',
  }

  return (
    <>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '0',
        }}
      >
        My commitment.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', margin: '24px 0 8px' }}>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.3 }}>
            I, _______ , begin.
          </div>
          <input
            style={inputStyle}
            placeholder="your first name"
            autoComplete="off"
            maxLength={24}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--ink)' }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--ink2)' }}
          />
        </div>

        {/* Why */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.3 }}>
            This matters to me because
          </div>
          <input
            style={inputStyle}
            placeholder="in your own words"
            autoComplete="off"
            maxLength={120}
            value={why}
            onChange={(e) => onWhyChange(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--ink)' }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--ink2)' }}
          />
        </div>

        {/* Focus dimension */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.3 }}>
            The dimension I need most right now:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '4px',
            }}
          >
            {DIMS.map((dim) => {
              const isSelected = chosenDim === dim.key
              return (
                <button
                  key={dim.key}
                  onClick={() => onDimChange(dim.key)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '16px',
                    border: `1.5px solid ${isSelected ? 'var(--ink)' : dim.color}`,
                    background: isSelected ? 'var(--ink)' : 'var(--card)',
                    color: isSelected ? 'var(--cream)' : dim.color,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {dim.label}
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            fontSize: '13px',
            color: 'var(--ink2)',
            fontStyle: 'italic',
          }}
        >
          {today}
        </div>
      </div>
    </>
  )
}

// ─── Main OnboardingFlow ─────────────────────────────────────
interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [slide, setSlide] = useState(0)
  const [demoTier, setDemoTier] = useState<'P' | 'S' | 'M' | 'R'>('S')
  const [name, setName] = useState('')
  const [why, setWhy] = useState('')
  const [chosenDim, setChosenDim] = useState<Dimension | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const initFromFocusDim = useTodayStore((s) => s.initFromFocusDim)

  const canSubmit =
    name.trim().length > 0 && why.trim().length > 0 && chosenDim !== null

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    const trimmedName = name.trim()
    const trimmedWhy = why.trim()
    const dim = chosenDim as Dimension
    const trialStartedAt = new Date().toISOString()

    // The auth gate guarantees a verified session here — if the profile write
    // fails, block submission so the user isn't trapped in local-only state.
    try {
      const { data: { user }, error: getUserErr } = await supabase.auth.getUser()
      if (getUserErr || !user) {
        throw new Error("We couldn't confirm your session. Sign in again and retry.")
      }

      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: trimmedName,
        commit_why: trimmedWhy,
        focus_dim: dim,
        subscription_status: 'trial',
        trial_started_at: trialStartedAt,
        member_since: trialStartedAt.split('T')[0],
      })
      if (upsertErr) throw upsertErr
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "We couldn't save your commitment. Try again.")
      setIsSubmitting(false)
      return
    }

    completeOnboarding({ name: trimmedName, why: trimmedWhy, dim, trialStartedAt })
    initFromFocusDim(dim)
    setIsSubmitting(false)
    onComplete()
  }, [canSubmit, isSubmitting, name, why, chosenDim, completeOnboarding, initFromFocusDim, onComplete])

  const advance = () => {
    if (slide < 3) setSlide((s) => s + 1)
    else handleSubmit()
  }

  const skipToCommitment = () => setSlide(3)

  const btnLabel =
    slide < 3
      ? 'Continue'
      : isSubmitting
      ? 'Entering…'
      : 'Enter the club'

  const btnDisabled = slide === 3 && (!canSubmit || isSubmitting)

  const SLIDES = [
    <WelcomeSlide />,
    <DimensionsSlide />,
    <TiersSlide demoTier={demoTier} setDemoTier={setDemoTier} />,
    <CommitmentSlide
      name={name}
      why={why}
      chosenDim={chosenDim}
      onNameChange={setName}
      onWhyChange={setWhy}
      onDimChange={setChosenDim}
    />,
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Progress dots */}
      <ObDots current={slide} />

      {/* Slides container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {SLIDES.map((slideContent, i) => (
          <div
            key={i}
            className="no-scrollbar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              padding: i === 3 ? '48px 32px 0' : '0 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: i === 3 ? 'flex-start' : 'center',
              transition: 'transform 0.5s cubic-bezier(0.3, 0.9, 0.3, 1)',
              transform: `translateX(${(i - slide) * 100}%)`,
              overflowY: 'auto',
            }}
          >
            {slideContent}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div
        style={{
          padding: '16px 32px 40px',
          flexShrink: 0,
        }}
      >
        {submitError && slide === 3 && (
          <div
            role="alert"
            style={{
              fontSize: '12px',
              color: 'var(--emotional)',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            {submitError}
          </div>
        )}
        <button
          onClick={advance}
          disabled={btnDisabled}
          style={{
            display: 'block',
            width: '100%',
            padding: '18px',
            borderRadius: '28px',
            background: 'var(--ink)',
            color: 'var(--cream)',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: btnDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: btnDisabled ? 0.3 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {btnLabel}
        </button>

        {/* Skip link — slides 1 and 2 only — jumps to commitment screen */}
        {(slide === 1 || slide === 2) && (
          <div
            onClick={skipToCommitment}
            style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip introduction
          </div>
        )}
      </div>
    </div>
  )
}
