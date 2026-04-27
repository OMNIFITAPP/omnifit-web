import { useState } from 'react'
import {
  useReadinessCheckinStore,
  CHECKIN_OPTIONS,
  coachingLine,
  type CheckinAxis,
  type Checkin,
} from '../../store/readinessCheckinStore'

interface Props {
  open: boolean
  onClose: () => void
}

const QUESTIONS: Array<{ axis: CheckinAxis; text: string }> = [
  { axis: 'sleep',       text: 'How did you sleep?' },
  { axis: 'body',        text: 'How does your body feel?' },
  { axis: 'mind',        text: "How's your mind?" },
  { axis: 'nourishment', text: 'How nourished do you feel?' },
]

export function ReadinessCheckinFlow({ open, onClose }: Props) {
  const save = useReadinessCheckinStore((s) => s.save)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<CheckinAxis, number | null>>({
    sleep: null, body: null, mind: null, nourishment: null,
  })
  const [result, setResult] = useState<Checkin | null>(null)
  const [chosen, setChosen] = useState<number | null>(null)

  function reset() {
    setStep(0)
    setAnswers({ sleep: null, body: null, mind: null, nourishment: null })
    setResult(null)
    setChosen(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function pick(axis: CheckinAxis, value: number) {
    if (chosen !== null) return
    setChosen(value)
    const next = { ...answers, [axis]: value }
    setAnswers(next)
    setTimeout(async () => {
      setChosen(null)
      if (step < QUESTIONS.length - 1) {
        setStep((n) => n + 1)
      } else {
        const saved = await save({
          sleep: next.sleep!,
          body: next.body!,
          mind: next.mind!,
          nourishment: next.nourishment!,
        })
        setResult(saved)
      }
    }, 300)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        // 100dvh = dynamic viewport height; excludes iOS browser chrome.
        height: '100dvh',
        maxWidth: '430px',
        margin: '0 auto',
        background: 'var(--cream)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {result ? (
        <ResultView result={result} onClose={handleClose} />
      ) : (
        <QuestionView
          index={step}
          total={QUESTIONS.length}
          axis={QUESTIONS[step].axis}
          text={QUESTIONS[step].text}
          chosen={chosen}
          onPick={pick}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

function QuestionView({
  index, total, axis, text, chosen, onPick, onClose,
}: {
  index: number
  total: number
  axis: CheckinAxis
  text: string
  chosen: number | null
  onPick: (axis: CheckinAxis, value: number) => void
  onClose: () => void
}) {
  const options = CHECKIN_OPTIONS[axis]
  return (
    <>
      {/* Top bar: close + dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 8px',
        }}
      >
        <button
          type="button"
          aria-label="Cancel check-in"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '22px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: i <= index ? 'var(--ink)' : 'var(--line)',
                transition: 'background 0.25s ease',
              }}
            />
          ))}
        </div>
        <div style={{ width: '38px' }} />
      </div>

      {/* Question */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 20px',
          gap: '28px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {text}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((label, i) => {
            const value = i + 1
            const isChosen = chosen === value
            return (
              <button
                key={label}
                type="button"
                disabled={chosen !== null}
                onClick={() => onPick(axis, value)}
                style={{
                  height: '56px',
                  borderRadius: '20px',
                  border: isChosen ? '1px solid var(--ink)' : '1px solid var(--line)',
                  background: isChosen ? 'var(--ink)' : 'var(--card)',
                  color: isChosen ? 'var(--cream)' : 'var(--ink)',
                  fontSize: '16px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: chosen === null ? 'pointer' : 'default',
                  transition: 'background 0.2s ease, color 0.2s ease, border 0.2s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: '24px' }} />
    </>
  )
}

function ResultView({ result, onClose }: { result: Checkin; onClose: () => void }) {
  // Three vertical regions per spec:
  //   1. Top spacer — flex: 1 (auto-fills above content)
  //   2. Center content — flex-shrink: 0 (state word + coaching)
  //   3. Bottom button — flex-shrink: 0 with safe-area padding
  return (
    <>
      {/* 1. Top spacer */}
      <div style={{ flex: 1 }} aria-hidden />

      {/* 2. Center content */}
      <div
        style={{
          flexShrink: 0,
          textAlign: 'center',
          padding: '0 28px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          Today reads
        </div>
        <div
          style={{
            fontSize: '40px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
        >
          {result.state}
        </div>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--ink)',
            marginTop: '14px',
            lineHeight: 1.5,
            maxWidth: '320px',
            marginInline: 'auto',
          }}
        >
          {coachingLine(result.state)}
        </p>
      </div>

      {/* 3. Bottom button */}
      <div
        style={{
          flexShrink: 0,
          padding: '24px 20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            background: 'var(--ink)',
            color: 'var(--cream)',
            border: 'none',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Return to today
        </button>
      </div>
    </>
  )
}
