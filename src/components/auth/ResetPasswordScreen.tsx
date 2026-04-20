import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Rendered when the user clicks the reset link in their email.
// Supabase lands them at /reset-password with a temporary session — we can
// call updateUser to set a new password.
export function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => {
        window.location.replace('/')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: '430px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          marginBottom: '20px',
        }}
      >
        Set a new password
      </h1>

      {done ? (
        <p style={{ fontSize: '14px', color: 'var(--ink)' }}>
          Password updated. Taking you back in…
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink2)',
                fontWeight: 600,
              }}
            >
              New password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1.5px solid var(--ink2)',
                padding: '8px 0',
                fontSize: '16px',
                color: 'var(--ink)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </label>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--emotional)', lineHeight: 1.5 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: '8px',
              padding: '16px',
              borderRadius: '24px',
              background: 'var(--ink)',
              color: 'var(--cream)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {busy ? '…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  )
}
