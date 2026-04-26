import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useUserStore } from './userStore'

interface NotesState {
  notes: Record<string, string>   // date(yyyy-mm-dd) -> content
}

interface NotesActions {
  setNote: (date: string, content: string) => void
  loadFor: (dates: string[]) => Promise<void>
  /** Persist a note to Supabase. Caller should debounce. */
  flush: (date: string, content: string) => Promise<void>
}

export const useDailyNotesStore = create<NotesState & NotesActions>()(
  persist(
    (set, get) => ({
      notes: {},

      setNote: (date, content) =>
        set((s) => ({ notes: { ...s.notes, [date]: content } })),

      loadFor: async (dates) => {
        const userId = useUserStore.getState().userId
        if (!userId || dates.length === 0) return
        try {
          const { data } = await supabase
            .from('daily_notes')
            .select('date, content')
            .eq('user_id', userId)
            .in('date', dates)
          if (!data) return
          const next = { ...get().notes }
          for (const row of data as Array<{ date: string; content: string | null }>) {
            next[row.date] = row.content ?? ''
          }
          set({ notes: next })
        } catch {
          /* offline */
        }
      },

      flush: async (date, content) => {
        const userId = useUserStore.getState().userId
        if (!userId) return
        try {
          await supabase
            .from('daily_notes')
            .upsert(
              { user_id: userId, date, content },
              { onConflict: 'user_id,date' }
            )
        } catch {
          /* swallow */
        }
      },
    }),
    { name: 'omnifit-notes' }
  )
)
