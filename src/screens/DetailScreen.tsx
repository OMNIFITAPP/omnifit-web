import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DIM_MAP } from '../data/dims'
import { getSession, TIER_LABELS } from '../data/sessions'
import { useSavedStore, type SavedKey } from '../store/savedStore'
import { useTodayStore } from '../store/todayStore'
import type { Dimension, SessionStep } from '../types'

function isValidTier(t: string): t is 'P' | 'S' | 'M' {
  return t === 'P' || t === 'S' || t === 'M'
}

export function DetailScreen() {
  const navigate = useNavigate()
  const { dim = '', tier = '' } = useParams()
  const dimConfig = DIM_MAP[dim]

  // Guard against bogus URLs
  if (!dimConfig || !isValidTier(tier)) {
    return <NotFound onBack={() => navigate('/')} />
  }

  return <PracticeFlow dim={dim as Dimension} tier={tier} />
}

// ─── Practice flow ───────────────────────────────────────────
function PracticeFlow({ dim, tier }: { dim: Dimension; tier: 'P' | 'S' | 'M' }) {
  const navigate = useNavigate()
  const dimConfig = DIM_MAP[dim]
  const session = useMemo(() => getSession(dim, tier), [dim, tier])

  const toggleChecked = useTodayStore((s) => s.toggleChecked)
  const alreadyChecked = useTodayStore((s) => s.checked[dim])

  const savedKey: SavedKey = `${dim}-${tier}`
  const saved = useSavedStore((s) => s.keys.includes(savedKey))
  const toggleSaved = useSavedStore((s) => s.toggle)

  // Step machine: -1 = intro, 0..n-1 = steps, n = completion
  const totalSteps = session.steps.length
  const [stepIndex, setStepIndex] = useState<number>(-1)
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState<number>(0) // seconds left in current auto/rest step

  const current: SessionStep | null =
    stepIndex >= 0 && stepIndex < totalSteps ? session.steps[stepIndex] : null

  // Reset timer when step changes
  useEffect(() => {
    if (!current) return
    if (current.mode === 'auto' || current.mode === 'rest') {
      setRemaining(current.seconds ?? 30)
    }
  }, [stepIndex, current])

  // Countdown tick for auto/rest steps
  useEffect(() => {
    if (!current) return
    if (current.mode === 'tap') return
    if (paused) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          // Advance on next tick so we don't batch-update during render
          setTimeout(() => setStepIndex((i) => i + 1), 0)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [current, paused, stepIndex])

  const advance = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, totalSteps))
  }, [totalSteps])

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  const handleMarkDone = useCallback(() => {
    if (!alreadyChecked) toggleChecked(dim)
    navigate(-1)
  }, [alreadyChecked, dim, navigate, toggleChecked])

  const isIntro = stepIndex === -1
  const isComplete = stepIndex >= totalSteps
  const isFirstStep = stepIndex === 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--cream)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="no-scrollbar"
    >
      {/* Hero header */}
      <header
        style={{
          padding: '56px 24px 28px',
          background: `linear-gradient(160deg, ${dimConfig.color} 0%, ${dimConfig.color} 60%, rgba(0,0,0,0.18))`,
          color: 'var(--cream)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Close session"
          style={{
            position: 'absolute',
            top: '20px',
            left: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            fontSize: '20px',
            color: 'var(--cream)',
            border: 'none',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        <button
          onClick={() => toggleSaved(savedKey)}
          aria-label={saved ? 'Remove bookmark' : 'Save session'}
          style={{
            position: 'absolute',
            top: '20px',
            right: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'var(--cream)',
            border: 'none',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {saved ? '★' : '☆'}
        </button>

        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: 0.9,
          }}
        >
          {dimConfig.label}
        </div>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginTop: '8px',
          }}
        >
          {session.name}
        </h2>
        <div style={{ marginTop: '10px', fontSize: '13px', opacity: 0.9 }}>
          {session.durationMin} min · {TIER_LABELS[tier]} · {session.focus}
        </div>

        {/* Step progress bar — only while in flow */}
        {!isIntro && (
          <div style={{ display: 'flex', gap: '3px', marginTop: '20px' }}>
            {session.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background:
                    i < stepIndex || isComplete
                      ? 'var(--cream)'
                      : i === stepIndex
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isIntro && <IntroBody session={session} dimColor={dimConfig.color} />}
        {current && (
          <StepBody
            step={current}
            cue={session.cues[stepIndex] ?? session.cues[session.cues.length - 1] ?? ''}
            remaining={remaining}
            paused={paused}
            stepNumber={stepIndex + 1}
            totalSteps={totalSteps}
          />
        )}
        {isComplete && (
          <CompletionBody
            mantra={session.mantra}
            alreadyChecked={alreadyChecked}
            onMarkDone={handleMarkDone}
          />
        )}
      </div>

      {/* Controls */}
      {!isComplete && (
        <footer
          style={{
            flexShrink: 0,
            padding: '16px 24px 32px',
            background: 'var(--cream)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {isIntro ? (
            <button
              type="button"
              onClick={() => setStepIndex(0)}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '24px',
                background: 'var(--ink)',
                color: 'var(--cream)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Begin
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={goBack}
                disabled={isFirstStep}
                aria-label="Previous step"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink2)',
                  fontSize: '18px',
                  cursor: isFirstStep ? 'default' : 'pointer',
                  opacity: isFirstStep ? 0.35 : 1,
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                ←
              </button>

              {current?.mode === 'tap' ? (
                <button
                  type="button"
                  onClick={advance}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '24px',
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Tap when ready
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? 'Resume' : 'Pause'}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '24px',
                      background: paused ? 'var(--ink)' : 'transparent',
                      color: paused ? 'var(--cream)' : 'var(--ink)',
                      border: paused ? 'none' : '1px solid var(--ink)',
                      fontSize: '14px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={advance}
                    aria-label="Skip step"
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      border: '1px solid var(--line)',
                      background: 'transparent',
                      color: 'var(--ink2)',
                      fontSize: '18px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    →
                  </button>
                </>
              )}
            </>
          )}
        </footer>
      )}
    </div>
  )
}

// ─── Subviews ────────────────────────────────────────────────
function IntroBody({
  session,
  dimColor,
}: {
  session: ReturnType<typeof getSession>
  dimColor: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <section>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: dimColor,
            marginBottom: '8px',
          }}
        >
          Mantra
        </div>
        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.4,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {session.mantra}
        </p>
      </section>

      <section>
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
          {session.steps.length} steps · {session.durationMin} min
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {session.steps.map((s, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'baseline',
                fontSize: '14px',
                color: 'var(--ink)',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--ink2)',
                  fontWeight: 600,
                  width: '22px',
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1 }}>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function StepBody({
  step,
  cue,
  remaining,
  paused,
  stepNumber,
  totalSteps,
}: {
  step: SessionStep
  cue: string
  remaining: number
  paused: boolean
  stepNumber: number
  totalSteps: number
}) {
  const showTimer = step.mode === 'auto' || step.mode === 'rest'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px', paddingTop: '12px' }}>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
        }}
      >
        Step {stepNumber} of {totalSteps}
        {step.mode === 'rest' && ' · Rest'}
      </div>

      {showTimer && (
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            opacity: paused ? 0.55 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {formatSec(remaining)}
        </div>
      )}

      <p
        style={{
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: 1.35,
          color: 'var(--ink)',
          margin: 0,
          maxWidth: '320px',
        }}
      >
        {step.text}
      </p>

      {cue && (
        <p
          style={{
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'var(--ink2)',
            lineHeight: 1.5,
            margin: 0,
            maxWidth: '320px',
          }}
        >
          {cue}
        </p>
      )}
    </div>
  )
}

function CompletionBody({
  mantra,
  alreadyChecked,
  onMarkDone,
}: {
  mantra: string
  alreadyChecked: boolean
  onMarkDone: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', paddingTop: '20px' }}>
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
        }}
      >
        Session complete
      </div>
      <h3
        style={{
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: 'var(--ink)',
          margin: 0,
          maxWidth: '300px',
        }}
      >
        Well practiced.
      </h3>
      <p
        style={{
          fontSize: '16px',
          fontStyle: 'italic',
          color: 'var(--ink)',
          lineHeight: 1.5,
          margin: 0,
          maxWidth: '320px',
        }}
      >
        {mantra}
      </p>

      <button
        type="button"
        onClick={onMarkDone}
        style={{
          marginTop: '16px',
          padding: '16px 28px',
          borderRadius: '24px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {alreadyChecked ? 'Return to today' : 'Mark as done'}
      </button>
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--cream)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '14px', color: 'var(--ink2)', marginBottom: '20px' }}>
        We couldn't find that session.
      </p>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '12px 24px',
          borderRadius: '24px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          border: 'none',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Back
      </button>
    </div>
  )
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}
