import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dimension, Tier, DailyPlan, CompletionState } from '../types'
import { DIMS } from '../data/dims'

interface TodayState {
  plan: DailyPlan
  checked: CompletionState
  planDate: string   // ISO date — resets the store if date changes
}

interface TodayActions {
  initFromFocusDim: (focusDim: Dimension) => void
  setTier: (dim: Dimension, tier: Tier) => void
  toggleChecked: (dim: Dimension) => void
  ensureFreshDay: () => void
}

const DEFAULT_PLAN: DailyPlan = {
  neuro: 'S',
  physical: 'P',
  cognitive: 'P',
  emotional: 'S',
}

const DEFAULT_CHECKED: CompletionState = {
  neuro: false,
  physical: false,
  cognitive: false,
  emotional: false,
}

export const useTodayStore = create<TodayState & TodayActions>()(
  persist(
    (set, get) => ({
      plan: DEFAULT_PLAN,
      checked: DEFAULT_CHECKED,
      planDate: '',

      initFromFocusDim: (focusDim) => {
        const today = new Date().toISOString().split('T')[0]
        const plan = Object.fromEntries(
          DIMS.map((d) => [d.key, d.key === focusDim ? ('P' as Tier) : ('M' as Tier)])
        ) as DailyPlan
        set({ plan, checked: DEFAULT_CHECKED, planDate: today })
      },

      setTier: (dim, tier) =>
        set((s) => ({ plan: { ...s.plan, [dim]: tier } })),

      toggleChecked: (dim) =>
        set((s) => ({ checked: { ...s.checked, [dim]: !s.checked[dim] } })),

      ensureFreshDay: () => {
        const today = new Date().toISOString().split('T')[0]
        if (get().planDate !== today) {
          set({ checked: DEFAULT_CHECKED, planDate: today })
        }
      },
    }),
    { name: 'omnifit-today' }
  )
)
