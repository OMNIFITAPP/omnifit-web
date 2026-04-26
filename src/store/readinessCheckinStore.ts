import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useUserStore } from './userStore'

export type CheckinAxis = 'sleep' | 'body' | 'mind' | 'nourishment'
export type CheckinState = 'Ready' | 'Balanced' | 'Low' | 'Rest is the move'

export interface Checkin {
  date: string              // yyyy-mm-dd
  sleep: number             // 1..4
  body: number
  mind: number
  nourishment: number
  composite: number         // 4..16
  state: CheckinState
}

export const CHECKIN_OPTIONS: Record<CheckinAxis, string[]> = {
  sleep:       ['Poorly',    'OK',      'Well',    'Deeply'],
  body:        ['Tired',     'Tight',   'Neutral', 'Loose'],
  mind:        ['Cluttered', 'Busy',    'Clear',   'Quiet'],
  nourishment: ['Depleted',  'Uneven',  'Adequate','Strong'],
}

export function stateFor(composite: number): CheckinState {
  if (composite >= 13) return 'Ready'
  if (composite >= 9)  return 'Balanced'
  if (composite >= 5)  return 'Low'
  return 'Rest is the move'
}

export function coachingLine(state: CheckinState): string {
  switch (state) {
    case 'Ready':             return 'A strong day is available to you.'
    case 'Balanced':          return 'A steady day suits. Your Secondary tier is ready.'
    case 'Low':               return 'Keep it light. A Micro day compounds better than a forced Primary.'
    case 'Rest is the move':  return 'Honor the signal. Rest is practice too.'
  }
}

export function shortCoaching(state: CheckinState): string {
  switch (state) {
    case 'Ready':             return 'A strong day is available.'
    case 'Balanced':          return 'Secondary suits today.'
    case 'Low':               return 'Keep it light.'
    case 'Rest is the move':  return 'The wave benefits from stillness.'
  }
}

function todayISO(): string {
  // Use local date — UTC drifts by a day for negative-offset timezones at night.
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CheckinState_ {
  today: Checkin | null
}

interface CheckinActions {
  ensureFreshDay: () => void
  loadFromServer: () => Promise<void>
  save: (args: { sleep: number; body: number; mind: number; nourishment: number }) => Promise<Checkin>
  clearToday: () => void
}

export const useReadinessCheckinStore = create<CheckinState_ & CheckinActions>()(
  persist(
    (set, get) => ({
      today: null,

      ensureFreshDay: () => {
        const today = todayISO()
        const c = get().today
        if (c && c.date !== today) set({ today: null })
      },

      loadFromServer: async () => {
        const userId = useUserStore.getState().userId
        if (!userId) return
        const date = todayISO()
        try {
          const { data } = await supabase
            .from('readiness_checkins')
            .select('date,sleep,body,mind,nourishment,composite,state')
            .eq('user_id', userId)
            .eq('date', date)
            .maybeSingle()
          if (data) {
            set({
              today: {
                date: data.date as string,
                sleep: data.sleep as number,
                body: data.body as number,
                mind: data.mind as number,
                nourishment: data.nourishment as number,
                composite: data.composite as number,
                state: data.state as CheckinState,
              },
            })
          }
        } catch {
          /* offline — keep local */
        }
      },

      save: async ({ sleep, body, mind, nourishment }) => {
        const composite = sleep + body + mind + nourishment
        const state = stateFor(composite)
        const date = todayISO()
        const checkin: Checkin = { date, sleep, body, mind, nourishment, composite, state }
        set({ today: checkin })

        const userId = useUserStore.getState().userId
        if (userId) {
          try {
            await supabase
              .from('readiness_checkins')
              .upsert(
                {
                  user_id: userId, date, sleep, body, mind, nourishment, composite, state,
                  wearable_source: 'manual',
                },
                { onConflict: 'user_id,date' }
              )
          } catch {
            /* local cache still holds */
          }
        }
        return checkin
      },

      clearToday: () => set({ today: null }),
    }),
    { name: 'omnifit-checkin' }
  )
)
