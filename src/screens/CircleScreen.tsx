import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/userStore'
import { DIM_MAP } from '../data/dims'
import type { Dimension } from '../types'

interface CircleRow {
  id: string
  city: string
  dimension: Dimension
  title: string
  datetime: string
  location: string
  host_name: string
  host_member_since: string
  description: string | null
  max_spots: number
  current_spots: number
}

type RsvpStatus = 'going' | 'maybe' | null

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function CircleScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useUserStore((s) => s.userId)
  const [circle, setCircle] = useState<CircleRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvp, setRsvp] = useState<RsvpStatus>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('circles')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (cancelled) return
        if (error) {
          console.error('[CircleScreen] circle fetch error', error)
        }
        if (data) setCircle(data as CircleRow)

        if (userId) {
          const { data: r } = await supabase
            .from('circle_rsvps')
            .select('status')
            .eq('user_id', userId)
            .eq('circle_id', id)
            .maybeSingle()
          if (!cancelled && r) setRsvp(r.status as RsvpStatus)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, userId])

  async function saveSpot() {
    if (!userId || !id || pending) return
    setPending(true)
    const optimistic: RsvpStatus = 'going'
    setRsvp(optimistic)
    setCircle((c) => c ? { ...c, current_spots: c.current_spots + 1 } : c)
    try {
      const { error } = await supabase
        .from('circle_rsvps')
        .insert({ user_id: userId, circle_id: id, status: 'going' })
      if (error) {
        console.error('[CircleScreen] save spot error', error)
        setRsvp(null)
        setCircle((c) => c ? { ...c, current_spots: Math.max(0, c.current_spots - 1) } : c)
      }
    } finally {
      setPending(false)
    }
  }

  async function cancel() {
    if (!userId || !id || pending) return
    const prevStatus = rsvp
    setPending(true)
    setRsvp(null)
    if (prevStatus === 'going') {
      setCircle((c) => c ? { ...c, current_spots: Math.max(0, c.current_spots - 1) } : c)
    }
    try {
      const { error } = await supabase
        .from('circle_rsvps')
        .delete()
        .eq('user_id', userId)
        .eq('circle_id', id)
      if (error) {
        console.error('[CircleScreen] cancel error', error)
        setRsvp(prevStatus)
        if (prevStatus === 'going') {
          setCircle((c) => c ? { ...c, current_spots: c.current_spots + 1 } : c)
        }
      }
    } finally {
      setPending(false)
    }
  }

  async function joinWaitlist() {
    if (!userId || !id || pending) return
    setPending(true)
    setRsvp('maybe')
    try {
      const { error } = await supabase
        .from('circle_rsvps')
        .insert({ user_id: userId, circle_id: id, status: 'maybe' })
      if (error) {
        console.error('[CircleScreen] waitlist error', error)
        setRsvp(null)
      }
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)' }}>Loading…</p>
      </div>
    )
  }

  if (!circle) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--ink2)', fontSize: '18px', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0' }}
        >
          ←
        </button>
        <p style={{ fontSize: '14px', color: 'var(--ink2)', marginTop: '12px' }}>That circle is missing.</p>
      </div>
    )
  }

  const dim = DIM_MAP[circle.dimension]
  const full = circle.current_spots >= circle.max_spots
  const seatsLeft = Math.max(0, circle.max_spots - circle.current_spots)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--cream)',
      }}
    >
      <div style={{ padding: '12px 12px 0' }}>
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '18px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '8px 12px',
          }}
        >
          ←
        </button>
      </div>

      <div style={{ flex: 1, padding: '12px 24px 24px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: dim.color,
          }}
        >
          {dim.label}
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            lineHeight: 1.2,
            marginTop: '6px',
          }}
        >
          {circle.title}
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '8px' }}>
          {formatWhen(circle.datetime)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '2px' }}>
          {circle.location}
        </div>

        {circle.description && (
          <section style={{ marginTop: '22px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
              About
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--ink)', marginTop: '8px' }}>
              {circle.description}
            </p>
          </section>
        )}

        <section style={{ marginTop: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
            Host
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: '8px' }}>
            <strong style={{ fontWeight: 600 }}>{circle.host_name}</strong>
            {circle.host_member_since && (
              <span style={{ color: 'var(--ink2)' }}> · member since {formatMemberSince(circle.host_member_since)}</span>
            )}
          </div>
        </section>

        <section style={{ marginTop: '22px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink2)' }}>
            {full
              ? 'Full · waitlist'
              : `${circle.current_spots} of ${circle.max_spots} going · ${seatsLeft} ${seatsLeft === 1 ? 'spot' : 'spots'} open`}
          </div>
        </section>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '20px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--cream)',
          borderTop: '1px solid var(--line)',
        }}
      >
        <RsvpButton
          rsvp={rsvp}
          full={full}
          pending={pending}
          onSaveSpot={saveSpot}
          onCancel={cancel}
          onJoinWaitlist={joinWaitlist}
        />
      </div>
    </div>
  )
}

function RsvpButton({
  rsvp, full, pending, onSaveSpot, onCancel, onJoinWaitlist,
}: {
  rsvp: RsvpStatus
  full: boolean
  pending: boolean
  onSaveSpot: () => void
  onCancel: () => void
  onJoinWaitlist: () => void
}) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: pending ? 'default' : 'pointer',
    opacity: pending ? 0.7 : 1,
  }
  if (rsvp === 'going') {
    return (
      <button type="button" onClick={onCancel} disabled={pending}
        style={{ ...base, background: 'var(--rose)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
        You're going · tap to cancel
      </button>
    )
  }
  if (rsvp === 'maybe') {
    return (
      <button type="button" onClick={onCancel} disabled={pending}
        style={{ ...base, background: 'transparent', color: 'var(--ink2)', border: '1px solid var(--line)' }}>
        On waitlist · tap to remove
      </button>
    )
  }
  if (full) {
    return (
      <button type="button" onClick={onJoinWaitlist} disabled={pending}
        style={{ ...base, background: 'transparent', color: 'var(--ink2)', border: '1px solid var(--line)' }}>
        Join waitlist
      </button>
    )
  }
  return (
    <button type="button" onClick={onSaveSpot} disabled={pending}
      style={{ ...base, background: 'var(--ink)', color: 'var(--cream)', border: 'none' }}>
      Save my spot
    </button>
  )
}
