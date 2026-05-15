import { useEffect, useState } from 'react'
import { useUserStore, PRIMARY_FOCUS_OPTIONS, type PrimaryFocus } from '../../store/userStore'
import { useCommitmentsStore } from '../../store/commitmentsStore'
import { DIMS, DIM_MAP } from '../../data/dims'
import type { Dimension } from '../../types'
import { playChime } from '../../lib/chime'
import { supabase } from '../../lib/supabase'

function formatMemberSince(iso: string): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function AccountTab() {
  const { name, commitWhy, focusDim, memberSince, subscriptionStatus, planTier } = useUserStore()
  const activeDims = useUserStore((s) => s.activeDims)
  const toggleActiveDim = useUserStore((s) => s.toggleActiveDim)
  const completionSound = useUserStore((s) => s.completionSound)
  const setCompletionSound = useUserStore((s) => s.setCompletionSound)
  const primaryFocus = useUserStore((s) => s.primaryFocus)
  const setPrimaryFocus = useUserStore((s) => s.setPrimaryFocus)
  const appPicksForMe = useUserStore((s) => s.appPicksForMe)
  const setAppPicksForMe = useUserStore((s) => s.setAppPicksForMe)
  const userId = useUserStore((s) => s.userId)

  function toggleAppPicks() {
    const next = !appPicksForMe
    setAppPicksForMe(next)
    if (userId) {
      supabase.from('profiles').update({ app_picks_for_me: next }).eq('id', userId).then(() => {})
    }
  }

  const planLabel =
    subscriptionStatus === 'trial'
      ? 'Trial'
      : planTier
      ? planTier.charAt(0).toUpperCase() + planTier.slice(1)
      : subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
  const focus = focusDim ? DIM_MAP[focusDim] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Identity */}
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px 18px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          Member
        </div>
        <div
          style={{
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            marginTop: '4px',
          }}
        >
          {name || 'Friend'}
        </div>

        <dl style={{ margin: '14px 0 0', display: 'grid', gap: '10px' }}>
          <Row label="Member since" value={formatMemberSince(memberSince)} />
          <Row label="Plan" value={planLabel} />
          {focus && <Row label="Focus" value={focus.label} valueColor={focus.color} />}
        </dl>
      </section>

      {/* Active dimensions */}
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px 18px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
            marginBottom: '14px',
          }}
        >
          Active dimensions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {DIMS.map((dim) => {
            const isActive = activeDims.includes(dim.key as Dimension)
            return (
              <div
                key={dim.key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: dim.color }}>
                    {dim.label}
                  </div>
                  {!isActive && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink2)',
                        fontStyle: 'italic',
                        marginTop: '2px',
                      }}
                    >
                      {dim.label}: training externally
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => toggleActiveDim(dim.key as Dimension)}
                  style={{
                    width: '44px',
                    height: '26px',
                    borderRadius: '13px',
                    background: isActive ? 'var(--ink)' : 'rgba(61,40,23,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: isActive ? '21px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--cream)',
                      transition: 'left 0.2s ease',
                      display: 'block',
                    }}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Settings */}
      <section
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '18px 18px 16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
            marginBottom: '14px',
          }}
        >
          Settings
        </div>

        {/* Primary focus */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="primary-focus"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '2px',
            }}
          >
            Primary focus
          </label>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--ink2)',
              marginBottom: '8px',
            }}
          >
            Shapes your session recommendations.
          </div>
          <select
            id="primary-focus"
            value={primaryFocus ?? ''}
            onChange={(e) => setPrimaryFocus((e.target.value || null) as PrimaryFocus | null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              background: 'var(--cream)',
              color: 'var(--ink)',
              fontSize: '14px',
              fontFamily: 'inherit',
              appearance: 'none',
            }}
          >
            <option value="">Not set</option>
            {PRIMARY_FOCUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Daily sessions: App picks for me */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Daily sessions
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ink2)',
                fontStyle: 'italic',
                marginTop: '2px',
              }}
            >
              App picks for you, or pick yourself each day.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={appPicksForMe}
            onClick={toggleAppPicks}
            style={{
              width: '44px',
              height: '26px',
              borderRadius: '13px',
              background: appPicksForMe ? 'var(--ink)' : 'rgba(61,40,23,0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: appPicksForMe ? '21px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--cream)',
                transition: 'left 0.2s ease',
                display: 'block',
              }}
            />
          </button>
        </div>

        {/* Completion sound toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Completion sound
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--ink2)',
                fontStyle: 'italic',
                marginTop: '2px',
              }}
            >
              A quiet bell when you finish a session.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={completionSound}
            onClick={() => {
              const next = !completionSound
              setCompletionSound(next)
              if (next) playChime()
            }}
            style={{
              width: '44px',
              height: '26px',
              borderRadius: '13px',
              background: completionSound ? 'var(--ink)' : 'rgba(61,40,23,0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: completionSound ? '21px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--cream)',
                transition: 'left 0.2s ease',
                display: 'block',
              }}
            />
          </button>
        </div>
      </section>

      {/* Seasonal commitments — current at top, past collapsed */}
      <CommitmentsList legacyWhy={commitWhy} />
    </div>
  )
}

function CommitmentsList({ legacyWhy }: { legacyWhy: string }) {
  const commitments = useCommitmentsStore((s) => s.commitments)
  const load = useCommitmentsStore((s) => s.load)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  useEffect(() => { load() }, [load])

  // No rows yet — fall back to legacy commit_why from profiles for continuity.
  if (commitments.length === 0) {
    if (!legacyWhy) return null
    return (
      <section style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
            marginBottom: '6px',
          }}
        >
          Commitment
        </div>
        <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--ink)', margin: 0 }}>
          This matters to me because{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--ink)' }}>{legacyWhy}</em>
        </p>
      </section>
    )
  }

  const [current, ...past] = commitments
  const visiblePast = past.slice(0, 4)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ background: 'var(--rose)', borderRadius: '20px', padding: '18px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink2)',
          }}
        >
          {current.season} {current.year}
        </div>
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.55,
            color: 'var(--ink)',
            margin: '8px 0 0',
          }}
        >
          This {current.season.toLowerCase()} matters to me because{' '}
          <em style={{ fontStyle: 'italic' }}>{current.why ?? '—'}</em>
        </p>
        {current.focus_dimension && (
          <div
            style={{
              fontSize: '11px',
              color: DIM_MAP[current.focus_dimension]?.color ?? 'var(--ink2)',
              fontWeight: 600,
              marginTop: '8px',
              letterSpacing: '0.04em',
            }}
          >
            Focus: {DIM_MAP[current.focus_dimension]?.label ?? current.focus_dimension}
          </div>
        )}
      </div>

      {visiblePast.map((c) => {
        const isOpen = expanded.has(c.id)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() =>
              setExpanded((s) => {
                const next = new Set(s)
                if (next.has(c.id)) next.delete(c.id); else next.add(c.id)
                return next
              })
            }
            style={{
              textAlign: 'left',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '12px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--ink)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink2)',
              }}
            >
              {c.season} {c.year}
            </div>
            {isOpen && (
              <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--ink)', margin: '6px 0 0' }}>
                <em>{c.why ?? '—'}</em>
                {c.focus_dimension && (
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: 'var(--ink2)' }}>
                    Focus: {DIM_MAP[c.focus_dimension]?.label ?? c.focus_dimension}
                  </span>
                )}
              </p>
            )}
          </button>
        )
      })}
    </section>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <dt style={{ fontSize: '12px', color: 'var(--ink2)' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: valueColor ?? 'var(--ink)',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
