import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/userStore'

export function MonthlyStats() {
  const userId = useUserStore((s) => s.userId)
  const [data, setData] = useState<{ minutes: number; sessions: number } | null>(null)

  useEffect(() => {
    if (!userId) return
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    supabase
      .from('session_completions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .gte('completed_at', monthStart)
      .then(({ data: rows }) => {
        if (!rows || rows.length === 0) { setData({ minutes: 0, sessions: 0 }); return }
        const sessions = rows.length
        const minutes = Math.round(
          rows.reduce((s, r) => s + ((r.duration_seconds as number) ?? 0), 0) / 60
        )
        setData({ minutes, sessions })
      })
  }, [userId])

  const hasData = data && data.sessions > 0

  return (
    <section style={{ marginTop: '20px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          marginBottom: '10px',
        }}
      >
        This month
      </div>
      {!hasData ? (
        <p style={{ fontSize: '12px', color: 'var(--ink2)', fontStyle: 'italic', margin: 0 }}>
          Complete your first session to begin tracking.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StatCard label="Minutes" value={String(data!.minutes)} />
          <StatCard label="Sessions" value={String(data!.sessions)} />
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '26px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--ink2)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: '4px',
        }}
      >
        {label}
      </div>
    </div>
  )
}
