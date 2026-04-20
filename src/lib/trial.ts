export const TRIAL_DAYS = 21

export interface TrialStatus {
  daysLeft: number        // whole days remaining, 0 if expired
  expired: boolean
  endsAt: Date | null
}

export function computeTrial(trialStartedAt: string | null): TrialStatus {
  if (!trialStartedAt) return { daysLeft: TRIAL_DAYS, expired: false, endsAt: null }
  const start = new Date(trialStartedAt).getTime()
  const end = start + TRIAL_DAYS * 24 * 60 * 60 * 1000
  const msLeft = end - Date.now()
  if (msLeft <= 0) return { daysLeft: 0, expired: true, endsAt: new Date(end) }
  return {
    daysLeft: Math.ceil(msLeft / (24 * 60 * 60 * 1000)),
    expired: false,
    endsAt: new Date(end),
  }
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

/** Returns true if the user has access to the app (trial not expired, or active sub). */
export function hasAccess(status: SubscriptionStatus, trialStartedAt: string | null): boolean {
  if (status === 'active') return true
  if (status === 'trial') return !computeTrial(trialStartedAt).expired
  return false
}
