import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface VerifyEmailScreenProps {
  email: string
}

export function VerifyEmailScreen({ email }: VerifyEmailScreenProps) {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function resend() {
    if (busy || !email) return
    setBusy(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
          marginBottom: '20px',
        }}
      >
        Almost there
      </div>
      <h1
        style={{
          fontSize: '26px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          lineHeight: 1.2,
          marginBottom: '16px',
        }}
      >
        Confirm your email to begin.
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--ink2)', lineHeight: 1.6, marginBottom: '8px' }}>
        We sent a verification link to
      </p>
      <p style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 600, marginBottom: '28px' }}>
        {email}
      </p>

      <button
        type="button"
        onClick={resend}
        disabled={busy || sent}
        style={{
          padding: '14px',
          borderRadius: '24px',
          background: 'var(--ink)',
          color: 'var(--cream)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: busy || sent ? 'default' : 'pointer',
          opacity: busy || sent ? 0.55 : 1,
          fontFamily: 'inherit',
          marginBottom: '12px',
        }}
      >
        {sent ? 'Sent — check your inbox' : busy ? '…' : 'Resend email'}
      </button>
      <button
        type="button"
        onClick={signOut}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
          fontSize: '12px',
          color: 'var(--ink2)',
          cursor: 'pointer',
          padding: '8px',
        }}
      >
        Use a different email
      </button>
    </div>
  )
}
