import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dimension, Tier, DailyPlan } from '../types'

// Stores overrides for future days only. Today lives in todayStore; past days
// come from the deterministic seed in data/week.ts.
// TODO(v2): persist actual day history in Supabase user_week.
interface WeekOverrideState {
  plans: Record<string, DailyPlan>   // date ISO -> plan override
}

interface WeekOverrideActions {
  setDayTier: (date: string, dim: Dimension, tier: Tier) => void
  getPlan: (date: string) => DailyPlan | undefined
}

export const useWeekStore = create<WeekOverrideState & WeekOverrideActions>()(
  persist(
    (set, get) => ({
      plans: {},
      setDayTier: (date, dim, tier) =>
        set((s) => {
          const base =
            s.plans[date] ??
            ({ neuro: 'M', physical: 'M', cognitive: 'M', emotional: 'M' } as DailyPlan)
          return { plans: { ...s.plans, [date]: { ...base, [dim]: tier } } }
        }),
      getPlan: (date) => get().plans[date],
    }),
    { name: 'omnifit-week' }
  )
)
