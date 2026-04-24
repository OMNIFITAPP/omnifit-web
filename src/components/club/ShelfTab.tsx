import { useState } from 'react'
import { SHELF, type ShelfCategory } from '../../data/shelf'
import { DIM_MAP } from '../../data/dims'

type Filter = 'all' | ShelfCategory

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all',         label: 'All'           },
  { key: 'neuro',       label: 'Neurological'  },
  { key: 'physical',    label: 'Physical'      },
  { key: 'cognitive',   label: 'Cognitive'     },
  { key: 'emotional',   label: 'Emotional'     },
  { key: 'foundation',  label: 'Foundations'   },
]

const FOUNDATION_COLOR = 'var(--ink2)'
const FOUNDATION_LABEL = 'Foundations'

export function ShelfTab() {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = filter === 'all' ? SHELF : SHELF.filter((a) => a.dim === filter)

  return (
    <div>
      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '4px',
        }}
        className="no-scrollbar"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: '999px',
                border: active ? 'none' : '1px solid var(--line)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Article list */}
      {filtered.length === 0 ? (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--ink2)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          Nothing on this shelf yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((a, i) => {
            const isFoundation = a.dim === 'foundation'
            const color = isFoundation ? FOUNDATION_COLOR : DIM_MAP[a.dim].color
            const label = isFoundation ? FOUNDATION_LABEL : DIM_MAP[a.dim].label
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
                    background: color,
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
                      color,
                    }}
                  >
                    {label}
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
      )}
    </div>
  )
}
