import { useState } from 'react'
import { CURRENT_TALK } from '../../data/talks'

function formatWeekOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TalkTab() {
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const talk = CURRENT_TALK

  return (
    <div>
      {/* Dark gradient card */}
      <section
        style={{
          background: 'linear-gradient(155deg, #2a1d12 0%, #3d2817 70%, #5a3a22)',
          color: '#fff',
          borderRadius: '22px',
          padding: '20px 20px 22px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 600,
            opacity: 0.75,
          }}
        >
          Week of {formatWeekOf(talk.weekOfIso)} · Coach {talk.coach}
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '10px 0 16px',
          }}
        >
          {talk.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause talk' : 'Play talk'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fff',
              color: 'var(--ink)',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>
            {talk.minutes} minutes ·{' '}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                textDecoration: 'underline',
                fontSize: '13px',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {expanded ? 'Hide' : 'Listen or read'}
            </button>
          </div>
        </div>

        {expanded && (
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.6,
              marginTop: '18px',
              opacity: 0.9,
            }}
          >
            {talk.body}
          </p>
        )}
      </section>

      <p
        style={{
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        One talk a week. Released on Mondays. Nothing to catch up on.
      </p>
    </div>
  )
}
