import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getShelfArticle, type ShelfDimension } from '../content/shelf-articles'

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

export function ArticleScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const article = id ? getShelfArticle(id) : undefined
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset scroll on mount.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [id])

  if (!article) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--ink2)', margin: 0 }}>
            That article is missing.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              marginTop: '16px',
              padding: '12px 18px',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              background: 'transparent',
              fontFamily: 'inherit',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  const color = DIM_COLOR[article.dimension]
  const label = DIM_LABEL[article.dimension]
  const paragraphs = article.body.split('\n\n')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        maxWidth: '430px',
        marginInline: 'auto',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '4px', background: color, flexShrink: 0 }} />

      {/* Top bar with back arrow */}
      <div
        style={{
          padding: '12px 8px 0 8px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 12px',
            cursor: 'pointer',
            color: 'var(--ink)',
            fontFamily: 'inherit',
            fontSize: '15px',
          }}
        >
          ←
        </button>
      </div>

      {/* Body — scrollable */}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '24px 24px 48px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
          }}
        >
          {label}
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: 'var(--ink)',
            marginTop: '8px',
          }}
        >
          {article.title}
        </h1>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink2)',
            marginTop: '6px',
            letterSpacing: '0.02em',
          }}
        >
          {article.readTime} min read
        </div>

        <div style={{ marginTop: '24px' }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'var(--ink)',
                margin: i === 0 ? 0 : '16px 0 0',
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
