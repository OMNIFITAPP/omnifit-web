import { useState } from 'react'
import { TalkTab } from '../components/club/TalkTab'
import { ShelfTab } from '../components/club/ShelfTab'
import { CirclesTab } from '../components/club/CirclesTab'
import { VoicesTab } from '../components/club/VoicesTab'

type RoomKey = 'talk' | 'shelf' | 'circles' | 'voices'

const ROOMS: Array<{ key: RoomKey; label: string }> = [
  { key: 'talk',    label: 'Talk'    },
  { key: 'shelf',   label: 'Shelf'   },
  { key: 'circles', label: 'Circles' },
  { key: 'voices',  label: 'Voices'  },
]

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

      {room === 'talk'    && <TalkTab />}
      {room === 'shelf'   && <ShelfTab />}
      {room === 'circles' && <CirclesTab />}
      {room === 'voices'  && <VoicesTab />}
    </div>
  )
}
