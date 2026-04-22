import { useEffect, useState } from 'react'
import { PLANS, FOUNDING_LIMIT, startCheckout, fetchFoundingCount } from '../../lib/stripe'
import { supabase } from '../../lib/supabase'
import type { PlanTier } from '../../store/userStore'

export function PaywallScreen() {
  const [foundingCount, setFoundingCount] = useState<number | null>(null)
  const [busy, setBusy] = useState<PlanTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFoundingCount().then(setFoundingCount)
  }, [])

  const foundingFull = foundingCount != null && foundingCount >= FOUNDING_LIMIT
  const plans = PLANS.filter((p) => !(p.tier === 'founding' && foundingFull))

  async function choose(tier: PlanTier) {
    if (busy) return
    setBusy(tier)
    setError(null)
    try {
      await startCheckout(tier)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.')
      setBusy(null)
    }
  }

  return (
    <div
      className="no-scrollbar"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--cream)',
        overflowY: 'auto',
        padding: '48px 24px 32px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
          marginBottom: '12px',
        }}
      >
        Your trial has ended
      </div>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          lineHeight: 1.2,
          marginBottom: '10px',
        }}
      >
        Become a member.
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--ink2)',
          lineHeight: 1.55,
          fontStyle: 'italic',
          marginBottom: '24px',
        }}
      >
        One practice, four dimensions. Continue where you left off.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plans.map((p) => {
          const loading = busy === p.tier
          return (
            <button
              key={p.tier}
              type="button"
              onClick={() => choose(p.tier)}
              disabled={!!busy}
              style={{
                textAlign: 'left',
                background: p.tier === 'annual' ? 'var(--rose)' : 'var(--card)',
                border: `1px solid ${p.tier === 'annual' ? 'var(--ink)' : 'var(--line)'}`,
                borderRadius: '18px',
                padding: '18px 18px 16px',
                cursor: busy ? 'default' : 'pointer',
                fontFamily: 'inherit',
                opacity: busy && !loading ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--ink2)',
                    fontWeight: 700,
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                  {p.priceLabel}
                  <span style={{ fontSize: '12px', color: 'var(--ink2)', fontWeight: 500, marginLeft: '4px' }}>
                    {p.cadence}
                  </span>
                </div>
              </div>
              {p.note && (
                <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '6px', lineHeight: 1.5 }}>
                  {p.note}
                  {p.tier === 'founding' && foundingCount != null && (
                    <> · {FOUNDING_LIMIT - foundingCount} spots left</>
                  )}
                </div>
              )}
              {loading && (
                <div style={{ fontSize: '11px', color: 'var(--ink2)', marginTop: '8px' }}>
                  Opening secure checkout…
                </div>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: 'var(--emotional)', marginTop: '16px' }}>{error}</div>
      )}

      <div
        style={{
          marginTop: '24px',
          fontSize: '11px',
          textAlign: 'center',
          color: 'var(--ink2)',
          lineHeight: 1.6,
        }}
      >
        Payment handled securely by Stripe. Cancel anytime from Account.
      </div>

      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        style={{
          display: 'block',
          margin: '18px auto 0',
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
          fontSize: '11px',
          color: 'var(--ink2)',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
