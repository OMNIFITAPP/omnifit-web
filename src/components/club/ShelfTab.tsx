import { SHELF } from '../../data/shelf'
import { DIM_MAP } from '../../data/dims'

export function ShelfTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {SHELF.map((a, i) => {
        const dim = DIM_MAP[a.dim]
        return (
          <button
            key={a.id}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              borderTop: i === 0 ? 'none' : '1px solid var(--line)',
              padding: '14px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: dim.color,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: dim.color,
                }}
              >
                {dim.label}
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginTop: '2px',
                  lineHeight: 1.3,
                }}
              >
                {a.title}
              </div>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ink2)',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              {a.readMin} min
            </div>
          </button>
        )
      })}
    </div>
  )
}
