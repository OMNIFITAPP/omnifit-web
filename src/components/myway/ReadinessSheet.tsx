import { BottomSheet } from '../layout/BottomSheet'

interface ReadinessSheetProps {
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '18px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
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

const bullet: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.55,
  color: 'var(--ink)',
  margin: '0 0 6px',
}

export function ReadinessSheet({ open, onClose }: ReadinessSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Today" title="Readiness today">
      <Section title="What this is">
        <p style={bullet}>
          Readiness is your state <em>today</em> — how rested, regulated, and available
          you are right now.
        </p>
        <p style={bullet}>
          It's different from capacity, which is what you've built over weeks and
          months. Capacity is the size of your engine; readiness is the fuel in the
          tank this morning.
        </p>
      </Section>

      <Section title="What influences it">
        <p style={bullet}><strong>Sleep</strong> — quality and duration over the last 1–2 nights.</p>
        <p style={bullet}><strong>Stress</strong> — mental load, emotional strain, life pressure.</p>
        <p style={bullet}><strong>Recent training</strong> — how hard you went yesterday and the day before.</p>
        <p style={bullet}><strong>Nutrition</strong> — eating enough, eating well, hydration.</p>
      </Section>

      <Section title="How to raise it">
        <p style={bullet}>Sleep earlier tonight. One extra hour is the fastest lever.</p>
        <p style={bullet}>Drop your Primary tier to Medium or Light when you feel flat — training when depleted costs more than it builds.</p>
        <p style={bullet}>Walk outside for 10 minutes. Daylight and movement regulate both nervous system and mood.</p>
        <p style={bullet}>Eat a real meal before training. Under-fueled sessions pull from tomorrow.</p>
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
