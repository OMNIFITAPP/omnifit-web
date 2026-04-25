import { BottomSheet } from '../layout/BottomSheet'
import {
  useReadinessCheckinStore,
  CHECKIN_OPTIONS,
  type CheckinAxis,
} from '../../store/readinessCheckinStore'

interface Props {
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '18px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

const AXIS_LABEL: Record<CheckinAxis, string> = {
  sleep: 'Sleep',
  body: 'Body',
  mind: 'Mind',
  nourishment: 'Nourishment',
}

const bodyStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.55,
  color: 'var(--ink)',
  margin: '0 0 6px',
}

export function ReadinessSheet({ open, onClose }: Props) {
  const checkin = useReadinessCheckinStore((s) => s.today)

  // Build coaching lines from checkin (2-3 most relevant)
  const lines: string[] = (() => {
    if (!checkin) return ['Check in on Today to get specific guidance.']
    const out: string[] = []
    if (checkin.sleep       <= 2) out.push('Sleep is the biggest lever. Aim for bed 45 minutes earlier tonight.')
    if (checkin.body        <= 2) out.push('The body is asking for lighter work. A Mobility Flow or walk serves better today than strength.')
    if (checkin.mind        <= 2) out.push('Before your next session, try 3 minutes of Exhale Lengthening. A cluttered mind settles with a longer out-breath.')
    if (checkin.nourishment <= 2) out.push('If you feel depleted, a small meal 45 minutes before Primary training helps recovery.')
    if (out.length === 0)          out.push('Everything points green. A strong day is available to you.')
    return out.slice(0, 3)
  })()

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Today" title="Readiness today">
      <Section title="What this is">
        <p style={bodyStyle}>
          Readiness is your state today — what the system has to work with right now.
          It changes day to day with sleep, stress, food, and recent training.
          Different from Capacity, which reflects what you've built over weeks.
        </p>
      </Section>

      <Section title="Today's reading">
        {checkin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(Object.keys(AXIS_LABEL) as CheckinAxis[]).map((axis) => {
              const value = checkin[axis]
              const word = CHECKIN_OPTIONS[axis][value - 1]
              return (
                <div
                  key={axis}
                  style={{
                    fontSize: '14px',
                    color: 'var(--ink)',
                    lineHeight: 1.55,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--ink2)' }}>{AXIS_LABEL[axis]}</span>
                  <strong style={{ fontWeight: 600 }}>{word}</strong>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={bodyStyle}>Check in on Today to see your reading.</p>
        )}
      </Section>

      <Section title="How to raise it">
        {lines.map((line, i) => (
          <p key={i} style={bodyStyle}>{line}</p>
        ))}
      </Section>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '14px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          border: 'none',
          borderRadius: '14px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Got it
      </button>
    </BottomSheet>
  )
}
