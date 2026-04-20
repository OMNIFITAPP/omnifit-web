import { useEffect, useState } from 'react'
import { useCityStore, CITIES } from '../../store/cityStore'
import { supabase } from '../../lib/supabase'
import { DIM_MAP } from '../../data/dims'
import { BottomSheet } from '../layout/BottomSheet'
import type { Dimension } from '../../types'

interface Circle {
  id: string
  city: string
  dimension: Dimension
  title: string
  datetime: string              // ISO
  location: string
  host_name: string
  host_member_since: string     // ISO yyyy-mm-dd
  max_spots: number
  current_spots: number
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMemberSince(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function CirclesTab() {
  const city = useCityStore((s) => s.city)
  const setCity = useCityStore((s) => s.setCity)
  const [cityOpen, setCityOpen] = useState(false)
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('circles')
          .select('*')
          .eq('city', city)
          .gt('datetime', new Date().toISOString())
          .order('datetime', { ascending: true })
        if (cancelled) return
        if (error) setCircles([])
        else setCircles((data as Circle[]) ?? [])
      } catch {
        if (!cancelled) setCircles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [city])

  return (
    <div>
      {/* City header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '12px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink2)',
              fontWeight: 600,
            }}
          >
            Your city
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
            {city}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCityOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink2)',
            fontSize: '12px',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Change city
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--ink2)', padding: '20px 0' }}>Loading…</div>
      ) : circles.length === 0 ? (
        <EmptyCircles city={city} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {circles.map((c) => (
              <CircleCard key={c.id} circle={c} />
            ))}
          </div>

          <button
            type="button"
            style={{
              marginTop: '14px',
              width: '100%',
              border: '1px dashed var(--line)',
              borderRadius: '14px',
              padding: '14px',
              background: 'transparent',
              color: 'var(--ink2)',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Propose a circle
          </button>

          <p
            style={{
              marginTop: '14px',
              fontSize: '12px',
              color: 'var(--ink2)',
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Small rooms. Real faces. Come once a month.
          </p>
        </>
      )}

      {/* City picker */}
      <BottomSheet
        open={cityOpen}
        onClose={() => setCityOpen(false)}
        eyebrow="Circles"
        title="Change city"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' }}>
          {CITIES.map((c) => {
            const active = c === city
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCity(c)
                  setCityOpen(false)
                }}
                style={{
                  textAlign: 'left',
                  background: active ? 'var(--rose)' : 'transparent',
                  border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}

function CircleCard({ circle }: { circle: Circle }) {
  const dim = DIM_MAP[circle.dimension]
  const full = circle.current_spots >= circle.max_spots
  return (
    <div
      className={full ? 'spots full' : 'spots'}
      style={{
        position: 'relative',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '18px',
        padding: '14px 16px 14px 20px',
        overflow: 'hidden',
        opacity: full ? 0.75 : 1,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: dim.color,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        <span style={{ color: dim.color }}>{dim.label}</span>
        <span style={{ color: full ? 'var(--ink2)' : 'var(--ink)' }}>
          {full ? 'Full' : `${circle.max_spots - circle.current_spots} of ${circle.max_spots} spots`}
        </span>
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          marginTop: '6px',
        }}
      >
        {circle.title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '4px' }}>
        {formatWhen(circle.datetime)} · {circle.location}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--ink2)',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--line)',
        }}
      >
        Hosted by <strong style={{ color: 'var(--ink)' }}>{circle.host_name}</strong>
        {circle.host_member_since && ` · member since ${formatMemberSince(circle.host_member_since)}`}
      </div>
    </div>
  )
}

function EmptyCircles({ city }: { city: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 12px 8px' }}>
      <p style={{ fontSize: '14px', color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>
        No circles in <strong>{city}</strong> yet. Be the first.
      </p>
      <button
        type="button"
        style={{
          marginTop: '18px',
          width: '100%',
          border: 'none',
          borderRadius: '16px',
          padding: '18px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        + Propose a circle
      </button>
      <p
        style={{
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--ink2)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        Every city starts with one person willing to set a time and a place.
      </p>
    </div>
  )
}
