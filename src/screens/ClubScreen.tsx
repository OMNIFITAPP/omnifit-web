import { useState, type ReactNode } from 'react'
import { TalkTab } from '../components/club/TalkTab'
import { ShelfTab } from '../components/club/ShelfTab'
import { CirclesTab } from '../components/club/CirclesTab'
import { VoicesTab } from '../components/club/VoicesTab'

type RoomKey = 'talk' | 'voices' | 'circles' | 'shelf'

const ROOMS: Array<{ key: RoomKey; label: string }> = [
  { key: 'talk',    label: 'Talk'    },
  { key: 'voices',  label: 'Voices'  },
  { key: 'circles', label: 'Circles' },
  { key: 'shelf',   label: 'Shelf'   },
]

/**
 * Each pane is its own scroll region, kept mounted with display:none on
 * inactive panes. Opaque cream background prevents bleed-through during the
 * tab switch — no transitions on the active/inactive state change.
 */
function Pane({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: active ? 'block' : 'none',
        position: 'relative',
        zIndex: active ? 1 : 0,
        background: 'var(--cream)',
        height: '100%',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
      className="no-scrollbar"
    >
      {children}
    </div>
  )
}

export function ClubScreen() {
  const [room, setRoom] = useState<RoomKey>('talk')

  return (
    <div style={{ padding: '16px 20px 12px' }}>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          marginBottom: '14px',
        }}
      >
        Club
      </h1>

      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '4px',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        {ROOMS.map((r) => {
          const active = room === r.key
          return (
            <button
              key={r.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setRoom(r.key)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '9px 4px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--cream)' : 'var(--ink2)',
                cursor: 'pointer',
              }}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      <Pane active={room === 'talk'}><TalkTab /></Pane>
      <Pane active={room === 'voices'}><VoicesTab /></Pane>
      <Pane active={room === 'circles'}><CirclesTab /></Pane>
      <Pane active={room === 'shelf'}><ShelfTab /></Pane>
    </div>
  )
}
