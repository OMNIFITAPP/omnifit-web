import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dimension } from '../types'
import type { SubscriptionStatus } from '../lib/trial'

export interface ReadinessScores {
  physical: number
  cognitive: number
  emotional: number
  neuro: number
  composite: number
}

export type PlanTier = 'monthly' | 'annual' | 'founding'

const ALL_DIMS: Dimension[] = ['neuro', 'physical', 'cognitive', 'emotional']

interface UserState {
  // Identity
  userId: string | null
  email: string
  emailVerified: boolean

  // Profile
  name: string
  commitWhy: string
  focusDim: Dimension | null
  isOnboarded: boolean
  memberSince: string           // ISO date (yyyy-mm-dd)

  // Preferences
  followMode: boolean           // true = app-selected plan, false = manual
  activeDims: Dimension[]       // dims shown on Today; all 4 by default

  // Billing
  subscriptionStatus: SubscriptionStatus
  planTier: PlanTier | null     // null while on trial
  trialStartedAt: string | null // ISO timestamp; 21-day trial
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null

  // Readiness (static MVP; replace with scoring engine later)
  readiness: ReadinessScores
}

interface UserActions {
  setAuth: (args: { userId: string; email: string; emailVerified: boolean }) => void
  completeOnboarding: (args: {
    name: string
    why: string
    dim: Dimension
    trialStartedAt: string
  }) => void
  setSubscription: (args: {
    status: SubscriptionStatus
    planTier?: PlanTier | null
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
  }) => void
  setFollowMode: (v: boolean) => void
  toggleActiveDim: (dim: Dimension) => void
  reset: () => void
}

const DEFAULT_STATE: UserState = {
  userId: null,
  email: '',
  emailVerified: false,

  name: '',
  commitWhy: '',
  focusDim: null,
  isOnboarded: false,
  memberSince: '',

  followMode: true,
  activeDims: [...ALL_DIMS],

  subscriptionStatus: 'trial',
  planTier: null,
  trialStartedAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,

  readiness: { physical: 78, cognitive: 84, emotional: 71, neuro: 82, composite: 79 },
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setAuth: ({ userId, email, emailVerified }) =>
        set({ userId, email, emailVerified }),

      completeOnboarding: ({ name, why, dim, trialStartedAt }) => {
        set({
          name,
          commitWhy: why,
          focusDim: dim,
          isOnboarded: true,
          memberSince: new Date().toISOString().split('T')[0],
          subscriptionStatus: 'trial',
          trialStartedAt,
        })
      },

      setSubscription: ({ status, planTier, stripeCustomerId, stripeSubscriptionId }) =>
        set((s) => ({
          subscriptionStatus: status,
          planTier: planTier ?? s.planTier,
          stripeCustomerId: stripeCustomerId ?? s.stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId ?? s.stripeSubscriptionId,
        })),

      setFollowMode: (v) => set({ followMode: v }),

      toggleActiveDim: (dim) =>
        set((s) => {
          const isActive = s.activeDims.includes(dim)
          // Always keep at least one dimension active
          if (isActive && s.activeDims.length === 1) return s
          return {
            activeDims: isActive
              ? s.activeDims.filter((d) => d !== dim)
              : [...s.activeDims, dim],
          }
        }),

      reset: () => set(DEFAULT_STATE),
    }),
    { name: 'omnifit-user' }
  )
)
