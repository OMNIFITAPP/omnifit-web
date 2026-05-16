import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useUserStore } from './userStore'
import type { Dimension } from '../types'

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'

export interface Commitment {
  id: string
  user_id: string
  season: Season
  year: number
  name: string | null
  why: string | null
  focus_dimension: Dimension | null
  created_at: string
}

interface CommitmentsState {
  commitments: Commitment[]
  loaded: boolean
}

interface CommitmentsActions {
  load: () => Promise<void>
  create: (input: { season: Season; year: number; name: string | null; why: string; focus: Dimension }) => Promise<Commitment | null>
}

export function currentSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5)  return 'Spring'
  if (m >= 6 && m <= 8)  return 'Summer'
  if (m >= 9 && m <= 11) return 'Fall'
  return 'Winter'
}

export function currentSeasonYear(date: Date = new Date()): number {
  // December rolls into next year's Winter
  return date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear()
}

export const useCommitmentsStore = create<CommitmentsState & CommitmentsActions>((set) => ({
  commitments: [],
  loaded: false,

  load: async () => {
    const userId = useUserStore.getState().userId
    if (!userId) {
      console.log('[commitment] load skipped — no userId')
      return
    }
    try {
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('season', { ascending: false })
      console.log('[commitment] load result:', { data, error, count: data?.length })
      // Set loaded:true even on empty/error so the gate can resolve;
      // commitments stays [] if nothing came back.
      set({ commitments: (data as Commitment[]) ?? [], loaded: true })
    } catch (err) {
      console.error('[commitment] load error', err)
      set({ loaded: true })
    }
  },

  create: async ({ season, year, name, why, focus }) => {
    const userId = useUserStore.getState().userId
    if (!userId) {
      console.log('[commitment] create skipped — no userId')
      return null
    }
    const payload = { user_id: userId, season, year, name, why, focus_dimension: focus }
    console.log('[commitment] writing to commitments:', payload)
    try {
      const { data, error } = await supabase
        .from('commitments')
        .insert(payload)
        .select('*')
        .single()
      console.log('[commitment] write result:', { data, error })
      if (error) {
        console.error('[commitment] create error', error)
        return null
      }
      const row = data as Commitment
      set((s) => ({ commitments: [row, ...s.commitments] }))
      return row
    } catch (err) {
      console.error('[commitment] create exception', err)
      return null
    }
  },
}))

/** Returns true when the user has no commitment row for the current season+year. */
export function shouldShowSeasonalPrompt(commitments: Commitment[], date: Date = new Date()): boolean {
  const season = currentSeason(date)
  const year = currentSeasonYear(date)
  return !commitments.some((c) => c.season === season && c.year === year)
}
