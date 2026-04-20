import { useNavigate } from 'react-router-dom'
import { useSavedStore, type SavedKey } from '../../store/savedStore'
import { DIM_MAP } from '../../data/dims'
import { getSession, TIER_LABELS } from '../../data/sessions'
import type { Dimension, Tier } from '../../types'

function parseKey(key: SavedKey): { dim: Dimension; tier: Exclude<Tier, 'R'> } {
  const [dim, tier] = key.split('-') as [Dimension, Exclude<Tier, 'R'>]
  return { dim, tier }
}

export function SavedTab() {
  const navigate = useNavigate()
  const keys = useSavedStore((s) => s.keys)

  if (keys.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed var(--line)',
          borderRadius: '18px',
          padding: '28px 20px',
          textAlign: 'center',
          color: 'var(--ink2)',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        No saved sessions yet. Tap the bookmark icon on any session to save it here.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {keys.map((key) => {
        const { dim, tier } = parseKey(key)
        const cfg = DIM_MAP[dim]
        const s = getSession(dim, tier)
        return (
          <button
            key={key}
            type="button"
            onClick={() => navigate(`/session/${dim}/${tier}`)}
            style={{
              position: 'relative',
              textAlign: 'left',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '16px',
              padding: '14px 16px 14px 20px',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: cfg.color,
              }}
            />
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: cfg.color,
              }}
            >
              {cfg.label}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginTop: '2px',
              }}
            >
              {s.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>
              {s.durationMin} min · {TIER_LABELS[tier]} · {s.focus}
            </div>
          </button>
        )
      })}
    </div>
  )
}
