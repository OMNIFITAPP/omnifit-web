import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shelfArticles, type ShelfDimension } from '../../content/shelf-articles'
import { TALKS } from '../../data/talks'

type Segment = 'read' | 'listen'
type Filter = 'all' | ShelfDimension

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all',          label: 'All'           },
  { key: 'neurological', label: 'Neurological'  },
  { key: 'physical',     label: 'Physical'      },
  { key: 'cognitive',    label: 'Cognitive'     },
  { key: 'emotional',    label: 'Emotional'     },
  { key: 'foundations',  label: 'Foundations'   },
]

const DIM_COLOR: Record<ShelfDimension, string> = {
  neurological: 'var(--neurological)',
  physical:     'var(--physical)',
  cognitive:    'var(--cognitive)',
  emotional:    'var(--emotional)',
  foundations:  'var(--ink2)',
}

const DIM_LABEL: Record<ShelfDimension, string> = {
  neurological: 'Neurological',
  physical:     'Physical',
  cognitive:    'Cognitive',
  emotional:    'Emotional',
  foundations:  'Foundations',
}

export function LibraryTab() {
  const navigate = useNavigate()
  const [segment, setSegment] = useState<Segment>('read')
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedTalkId, setExpandedTalkId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const articlesFiltered = filter === 'all' ? shelfArticles : shelfArticles.filter((a) => a.dimension === filter)
  const talksFiltered = filter === 'all' ? TALKS : TALKS.filter((t) => t.dimension === filter)

  return (
    <div>
      {/* Read / Listen segmented control */}
      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '3px',
          gap: '3px',
          marginBottom: '10px',
        }}
      >
        {(['read', 'listen'] as Segment[]).map((s) => {
          const active = segment === s
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSegment(s)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '7px 4px',
                borderRadius: '9px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
              }}
            >
              {s === 'read' ? 'Read' : 'Listen'}
            </button>
          )
        })}
      </div>

      {/* Dimension chips */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '4px',
        }}
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

      {/* Body */}
      {segment === 'read' ? (
        articlesFiltered.length === 0 ? (
          <Empty text="Nothing on this shelf yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {articlesFiltered.map((a, i) => (
              <Row
                key={a.id}
                isFirst={i === 0}
                dotColor={DIM_COLOR[a.dimension]}
                eyebrow={DIM_LABEL[a.dimension]}
                eyebrowColor={DIM_COLOR[a.dimension]}
                title={a.title}
                trailing={`${a.readTime} min`}
                onClick={() => navigate(`/article/${a.id}`)}
              />
            ))}
          </div>
        )
      ) : talksFiltered.length === 0 ? (
        <Empty text="No talks for this filter yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {talksFiltered.map((t, i) => {
            const isExpanded = expandedTalkId === t.id
            return (
              <div key={t.id}>
                <Row
                  isFirst={i === 0}
                  dotColor={DIM_COLOR[t.dimension]}
                  eyebrow={DIM_LABEL[t.dimension]}
                  eyebrowColor={DIM_COLOR[t.dimension]}
                  title={t.title}
                  trailing={`${t.minutes} min`}
                  onClick={() => setExpandedTalkId(isExpanded ? null : t.id)}
                />
                {isExpanded && (
                  <section
                    style={{
                      background: 'linear-gradient(155deg, #2a1d12 0%, #3d2817 70%, #5a3a22)',
                      color: '#fff',
                      borderRadius: '18px',
                      padding: '18px',
                      marginTop: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
                      Coach {t.coach}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setPlayingId((p) => (p === t.id ? null : t.id))}
                        aria-label={playingId === t.id ? 'Pause' : 'Play'}
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
                        {playingId === t.id ? '❚❚' : '▶'}
                      </button>
                      <div style={{ fontSize: '13px', opacity: 0.85 }}>
                        {t.minutes} minutes
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, marginTop: '14px', opacity: 0.9 }}>
                      {t.body}
                    </p>
                  </section>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Row({
  isFirst, dotColor, eyebrow, eyebrowColor, title, trailing, onClick,
}: {
  isFirst: boolean
  dotColor: string
  eyebrow: string
  eyebrowColor: string
  title: string
  trailing: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        borderTop: isFirst ? 'none' : '1px solid var(--line)',
        padding: '14px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: dotColor,
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
            color: eyebrowColor,
          }}
        >
          {eyebrow}
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
          {title}
        </div>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--ink2)', letterSpacing: '0.04em', flexShrink: 0 }}>
        {trailing}
      </div>
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: '13px',
        color: 'var(--ink2)',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '20px 0',
      }}
    >
      {text}
    </p>
  )
}
