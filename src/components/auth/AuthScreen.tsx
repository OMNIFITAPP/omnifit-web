import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Mode = 'signin' | 'signup' | 'reset'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })
        if (error) throw error
        setMessage({
          kind: 'info',
          text: 'Check your email to verify your account. The link opens OMNIFIT.',
        })
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // App.tsx listens to auth state — it will advance the gate.
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage({
          kind: 'info',
          text: 'If that email is on file, a reset link is on its way.',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setMessage({ kind: 'error', text: msg })
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'

  const submitLabel =
    mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'

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
        padding: '56px 32px 32px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
          marginBottom: '24px',
        }}
      >
        OMNIFIT
      </div>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          marginBottom: '28px',
        }}
      >
        {mode === 'signup'
          ? 'A 21-day trial begins once you confirm your email. No credit card.'
          : mode === 'reset'
          ? 'Enter your email and we’ll send a secure link.'
          : 'Return to your practice.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        {mode !== 'reset' && (
          <Field
            label="Password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={setPassword}
            minLength={8}
          />
        )}

        {message && (
          <div
            style={{
              fontSize: '12px',
              color: message.kind === 'error' ? 'var(--emotional)' : 'var(--ink2)',
              lineHeight: 1.5,
              background: message.kind === 'error' ? 'transparent' : 'var(--rose)',
              padding: message.kind === 'error' ? 0 : '10px 12px',
              borderRadius: '10px',
            }}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: '6px',
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
          {busy ? '…' : submitLabel}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '22px' }}>
        {mode === 'signin' && (
          <>
            <SwitchLink onClick={() => setMode('signup')}>
              New here? <strong>Create an account</strong>
            </SwitchLink>
            <SwitchLink onClick={() => setMode('reset')}>Forgot your password?</SwitchLink>
          </>
        )}
        {mode === 'signup' && (
          <SwitchLink onClick={() => setMode('signin')}>
            Already a member? <strong>Sign in</strong>
          </SwitchLink>
        )}
        {mode === 'reset' && (
          <SwitchLink onClick={() => setMode('signin')}>Back to sign in</SwitchLink>
        )}
      </div>

      {/* TODO(v2): social auth (Google, Apple) goes here. Requires Supabase OAuth providers. */}
    </div>
  )
}

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
  minLength,
}: {
  label: string
  type: string
  autoComplete: string
  value: string
  onChange: (v: string) => void
  minLength?: number
}) {
  return (
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
        {label}
      </span>
      <input
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  )
}

function SwitchLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        fontFamily: 'inherit',
        fontSize: '13px',
        color: 'var(--ink2)',
        textAlign: 'center',
        padding: '4px 0',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
