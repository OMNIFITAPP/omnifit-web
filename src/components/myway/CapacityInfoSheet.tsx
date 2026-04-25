import { BottomSheet } from '../layout/BottomSheet'
import { DIM_MAP } from '../../data/dims'
import type { Dimension } from '../../types'

interface Props {
  open: boolean
  dim: Dimension | null
  onClose: () => void
}

const WHAT_THIS_IS: Record<Dimension, string> = {
  neuro:
    "The nervous system's efficiency and adaptability. Balance, coordination, reaction, proprioception. The system that coordinates everything else.",
  physical:
    "The body's ability to produce force, sustain work, move with quality, and tolerate physical demand.",
  cognitive:
    "The quality of attention, processing, learning, and executive function. The capacity that determines how well you use everything else you know.",
  emotional:
    "The ability to regulate internal states, remain functional under stress, and recover composure after difficulty.",
}

const WHAT_LIVES_INSIDE: Record<Dimension, string[]> = {
  neuro:     ['Balance', 'Coordination', 'Reaction', 'Proprioception', 'Visual-motor integration'],
  physical:  ['Strength', 'Mobility', 'Locomotion', 'Stability', 'Endurance'],
  cognitive: ['Attention', 'Memory', 'Learning', 'Executive function', 'Processing speed'],
  emotional: ['Regulation', 'Resilience', 'Awareness', 'Connection', 'Recovery'],
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

export function CapacityInfoSheet({ open, dim, onClose }: Props) {
  const config = dim ? DIM_MAP[dim] : null
  const body = dim ? WHAT_THIS_IS[dim] : ''
  const items = dim ? WHAT_LIVES_INSIDE[dim] : []

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow="Capacity"
      title={config?.label ?? ''}
    >
      {config && (
        <>
          <Section title="What this is">
            <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
              {body}
            </p>
          </Section>

          <Section title="What lives inside">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {items.map((item) => (
                <li
                  key={item}
                  style={{
                    fontSize: '14px',
                    color: 'var(--ink)',
                    lineHeight: 1.55,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: config.color,
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What this score reflects">
            <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink)', margin: 0 }}>
              This number reflects what you've built over weeks of practice. It
              changes slowly, not daily. Today's state is Readiness — a different
              thing.
            </p>
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
            Close
          </button>
        </>
      )}
    </BottomSheet>
  )
}

// Small info icon: thin circle with lowercase i.
export function InfoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="7" cy="4.2" r="0.7" fill="currentColor" />
      <line x1="7" y1="6.3" x2="7" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
