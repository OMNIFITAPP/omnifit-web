import { todayQuote } from '../../data/quotes'

export function DailyQuote() {
  const q = todayQuote()
  return (
    <section style={{ marginTop: '18px', padding: '0 4px' }}>
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.5,
          color: 'var(--ink)',
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        “{q.text}”
      </p>
      <p
        style={{
          fontSize: '11px',
          color: 'var(--ink2)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginTop: '6px',
        }}
      >
        — {q.attr}
      </p>
    </section>
  )
}
