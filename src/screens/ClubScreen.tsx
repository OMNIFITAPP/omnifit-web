import { useEffect, useState } from 'react'
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
 * NUCLEAR tab switching: only the active pane is mounted at any time. The
 * inactive panes literally do not exist in the DOM, so they cannot bleed
 * through, no matter what z-index, opacity, or overflow rules apply.
 */
export function ClubScreen() {
  const [room, setRoom] = useState<RoomKey>('talk')

  // Reset the AppLayout outer scroll to the top whenever the user switches
  // tabs — otherwise switching from a long pane to a short one leaves the
  // viewport scrolled past the new pane's content.
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('[data-app-scroll="true"]')
    if (scroller) scroller.scrollTop = 0
    else window.scrollTo(0, 0)
  }, [room])

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

      {/* No inner scroll region — AppLayout's outer scroll owns the page. */}
      <div style={{ width: '100%' }}>
        {room === 'talk'    && <TalkTab />}
        {room === 'voices'  && <VoicesTab />}
        {room === 'circles' && <CirclesTab />}
        {room === 'shelf'   && <ShelfTab />}
      </div>
    </div>
  )
}
