import { useState } from 'react'
import { DIMS } from '../../data/dims'
import { useUserStore } from '../../store/userStore'
import {
  useCommitmentsStore,
  currentSeason,
  currentSeasonYear,
  type Season,
} from '../../store/commitmentsStore'
import type { Dimension } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

export function SeasonalCommitmentPrompt({ open, onClose }: Props) {
  const name = useUserStore((s) => s.name)
  const create = useCommitmentsStore((s) => s.create)
  const [why, setWhy] = useState('')
  const [focus, setFocus] = useState<Dimension | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const season: Season = currentSeason()
  const year = currentSeasonYear()

  async function submit() {
    if (submitting || !focus || why.trim().length === 0) return
    setSubmitting(true)
    await create({ season, year, name: name || null, why: why.trim(), focus })
    setSubmitting(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        background: 'var(--cream)',
        zIndex: 450,
        maxWidth: '430px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}
      >
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            lineHeight: 1.15,
          }}
        >
          A new season begins.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink2)', marginTop: '8px', lineHeight: 1.55 }}>
          {season} is here. Renew your commitment.
        </p>

        <div style={{ marginTop: '28px' }}>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--ink)',
              lineHeight: 1.6,
            }}
          >
            I, <strong>{name || 'friend'}</strong>, begin this season.
          </p>
        </div>

        <label style={{ display: 'block', marginTop: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              marginBottom: '8px',
            }}
          >
            This season matters to me because
          </div>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value.slice(0, 280))}
            placeholder="…"
            rows={4}
            style={{
              width: '100%',
              resize: 'vertical',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '12px 14px',
              fontSize: '15px',
              lineHeight: 1.55,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              outline: 'none',
              minHeight: '110px',
            }}
          />
        </label>

        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              marginBottom: '8px',
            }}
          >
            The dimension I need most this season
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {DIMS.map((d) => {
              const active = focus === d.key
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setFocus(d.key as Dimension)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: `1px solid ${active ? d.color : 'var(--line)'}`,
                    background: active ? d.color : 'transparent',
                    color: active ? 'var(--cream)' : 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '20px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !focus || why.trim().length === 0}
          style={{
            width: '100%',
            padding: '16px',
            background: !focus || why.trim().length === 0 ? 'var(--line)' : 'var(--ink)',
            color: 'var(--cream)',
            border: 'none',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: !focus || why.trim().length === 0 ? 'default' : 'pointer',
          }}
        >
          Begin the season
        </button>
      </div>
    </div>
  )
}
