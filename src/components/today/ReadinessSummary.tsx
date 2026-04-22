import type { ReadinessScores } from '../../store/userStore'

interface ReadinessSummaryProps {
  scores: ReadinessScores
  title?: string
}

interface Ring {
  key: 'physical' | 'cognitive' | 'emotional' | 'neuro' | 'composite'
  label: string
  color: string
}

const RINGS: Ring[] = [
  { key: 'physical',  label: 'Physical',  color: 'var(--physical)' },
  { key: 'cognitive', label: 'Cognitive', color: 'var(--cognitive)' },
  { key: 'emotional', label: 'Emotional', color: 'var(--emotional)' },
  { key: 'neuro',     label: 'Neuro',     color: 'var(--neurological)' },
]

function Ring({ value, color, size = 44 }: { value: number; color: string; size?: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - value / 100)
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
        opacity={0.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="var(--ink)"
      >
        {value}
      </text>
    </svg>
  )
}

export function ReadinessSummary({ scores, title = 'Readiness' }: ReadinessSummaryProps) {
  return (
    <section
      style={{
        background: 'var(--rose)',
        borderRadius: '20px',
        padding: '16px 18px',
        marginTop: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink2)' }}>
          Whole <strong style={{ color: 'var(--ink)' }}>{scores.composite}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        {RINGS.map((ring) => (
          <div
            key={ring.key}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            <Ring value={scores[ring.key]} color={ring.color} />
            <div
              style={{
                fontSize: '10px',
                color: 'var(--ink2)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {ring.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
