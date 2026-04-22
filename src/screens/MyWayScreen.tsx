import { useState } from 'react'
import { ProgressTab } from '../components/myway/ProgressTab'
import { SavedTab } from '../components/myway/SavedTab'
import { AccountTab } from '../components/myway/AccountTab'

type TabKey = 'progress' | 'saved' | 'account'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'progress', label: 'Progress' },
  { key: 'saved',    label: 'Saved'    },
  { key: 'account',  label: 'Account'  },
]

export function MyWayScreen() {
  const [tab, setTab] = useState<TabKey>('progress')

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
        My Way
      </h1>

      {/* Segmented tabs */}
      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '4px',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.key)}
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
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'progress' && <ProgressTab />}
      {tab === 'saved'    && <SavedTab />}
      {tab === 'account'  && <AccountTab />}
    </div>
  )
}
