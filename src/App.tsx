import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AppLayout } from './components/layout/AppLayout'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { AuthScreen } from './components/auth/AuthScreen'
import { VerifyEmailScreen } from './components/auth/VerifyEmailScreen'
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen'
import { PaywallScreen } from './components/paywall/PaywallScreen'
import { TodayScreen } from './screens/TodayScreen'
import { MyWayScreen } from './screens/MyWayScreen'
import { ClubScreen } from './screens/ClubScreen'
import { DetailScreen } from './screens/DetailScreen'
import { ArticleScreen } from './screens/ArticleScreen'
import { useUserStore } from './store/userStore'
import { supabase } from './lib/supabase'
import { hasAccess } from './lib/trial'
import type { Dimension } from './types'

// ─── Auth + profile gate ─────────────────────────────────────
// Chain: session? → email verified? → profile (onboarded)? → trial/active?
// Anything missing renders a targeted screen above the main router.
function useGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)

  const setAuth = useUserStore((s) => s.setAuth)
  const setSubscription = useUserStore((s) => s.setSubscription)
  const completeOnboarding = useUserStore((s) => s.completeOnboarding)
  const isOnboarded = useUserStore((s) => s.isOnboarded)
  const subscriptionStatus = useUserStore((s) => s.subscriptionStatus)
  const trialStartedAt = useUserStore((s) => s.trialStartedAt)

  // Subscribe to auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Hydrate local store from session + profile
  useEffect(() => {
    if (!session?.user) {
      useUserStore.getState().reset()
      return
    }
    const user = session.user
    setAuth({
      userId: user.id,
      email: user.email ?? '',
      emailVerified: !!user.email_confirmed_at,
    })

    // Only pull profile once verified
    if (!user.email_confirmed_at) return

    let cancelled = false
    ;(async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'name, commit_why, focus_dim, subscription_status, plan_tier, trial_started_at, stripe_customer_id, stripe_subscription_id'
          )
          .eq('id', user.id)
          .maybeSingle()
        if (cancelled || !profile) return

        if (profile.name && profile.focus_dim && profile.trial_started_at) {
          completeOnboarding({
            name: profile.name as string,
            why: (profile.commit_why as string) ?? '',
            dim: profile.focus_dim as Dimension,
            trialStartedAt: profile.trial_started_at as string,
          })
        }

        if (profile.subscription_status) {
          setSubscription({
            status: profile.subscription_status as Parameters<typeof setSubscription>[0]['status'],
            planTier: (profile.plan_tier as Parameters<typeof setSubscription>[0]['planTier']) ?? null,
            stripeCustomerId: (profile.stripe_customer_id as string) ?? null,
            stripeSubscriptionId: (profile.stripe_subscription_id as string) ?? null,
          })
        }
      } catch {
        /* fall through to local defaults */
      }
    })()
    return () => { cancelled = true }
  }, [session, setAuth, setSubscription, completeOnboarding])

  return {
    checked,
    session,
    emailVerified: !!session?.user?.email_confirmed_at,
    email: session?.user?.email ?? '',
    isOnboarded,
    hasActiveAccess: hasAccess(subscriptionStatus, trialStartedAt),
  }
}

function LoadingShell() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--ink2)',
          fontWeight: 700,
        }}
      >
        OMNIFIT
      </div>
    </div>
  )
}

export default function App() {
  const gate = useGate()

  // Password reset is a distinct entry point — handle it before the gate so
  // the Supabase recovery session doesn't get caught as a normal sign-in.
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordScreen />
  }

  if (!gate.checked) return <LoadingShell />

  if (!gate.session) {
    return <AuthScreen />
  }

  if (!gate.emailVerified) {
    return <VerifyEmailScreen email={gate.email} />
  }

  if (!gate.isOnboarded) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'var(--cream)' }} />
        <OnboardingFlow onComplete={() => { /* store update re-renders */ }} />
      </>
    )
  }

  if (!gate.hasActiveAccess) {
    return <PaywallScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayScreen />} />
          <Route path="myway" element={<MyWayScreen />} />
          <Route path="club" element={<ClubScreen />} />
        </Route>
        <Route path="session/:dim/:tier" element={<DetailScreen />} />
        <Route path="article/:id" element={<ArticleScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
