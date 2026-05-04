import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useUserStore } from './userStore'
import type { Dimension, Tier } from '../types'

/**
 * For each (dimension, tier), pick one session ID per day. The pick is
 * deterministic-per-(user, date) so a refresh doesn't reshuffle, and biased
 * against any session_name the user completed in the last 3 days. Manual
 * picks (set via the swap sheet) override automatic picks until end-of-day.
 */

type Key = string  // `${dim}:${tier}` where tier ∈ P|S|M

interface DailyPicksState {
  date: string                              // yyyy-mm-dd; reset triggers recompute
  picks: Record<Key, string>                // auto-picked session id per key
  manual: Record<Key, string>               // user-overridden id per key (swap sheet)
  recentlyDoneNames: string[]               // session_name list, last 3 days
}

interface DailyPicksActions {
  ensureFreshDay: () => void
  loadAndCompute: (
    pools: Record<Dimension, Record<'P' | 'S' | 'M', Array<{ id: string; name: string }>>>
  ) => Promise<void>
  setManual: (dim: Dimension, tier: 'P' | 'S' | 'M', sessionId: string) => void
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Stable 32-bit hash of a string. */
function hash32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** Pick one element from `pool` deterministically per `seed`, preferring items NOT in `exclude`. */
function seededPick<T extends { id: string; name: string }>(
  pool: T[],
  exclude: Set<string>,
  seed: number
): T | null {
  if (pool.length === 0) return null
  const fresh = pool.filter((p) => !exclude.has(p.name))
  const ordered = fresh.length > 0 ? fresh : pool
  return ordered[seed % ordered.length]
}

export const useDailyPickStore = create<DailyPicksState & DailyPicksActions>()(
  persist(
    (set, get) => ({
      date: '',
      picks: {},
      manual: {},
      recentlyDoneNames: [],

      ensureFreshDay: () => {
        const today = todayISO()
        if (get().date !== today) {
          set({ date: today, picks: {}, manual: {} })
        }
      },

      loadAndCompute: async (pools) => {
        const userId = useUserStore.getState().userId
        const today = todayISO()

        // Refresh recent-completion list (skip if no auth yet)
        let exclude = new Set<string>()
        if (userId) {
          try {
            const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            const { data } = await supabase
              .from('session_completions')
              .select('session_name')
              .eq('user_id', userId)
              .gte('completed_at', since)
            if (data) {
              const names = (data as Array<{ session_name: string }>)
                .map((r) => r.session_name)
                .filter(Boolean)
              exclude = new Set(names)
              set({ recentlyDoneNames: Array.from(exclude) })
            }
          } catch {
            // offline — fall back to stored recentlyDoneNames
            exclude = new Set(get().recentlyDoneNames)
          }
        } else {
          exclude = new Set(get().recentlyDoneNames)
        }

        // Recompute deterministic picks
        const seedBase = `${userId ?? 'anon'}:${today}`
        const picks: Record<Key, string> = {}
        for (const dim of Object.keys(pools) as Dimension[]) {
          for (const tier of ['P', 'S', 'M'] as const) {
            const pool = pools[dim][tier]
            const seed = hash32(`${seedBase}:${dim}:${tier}`)
            const chosen = seededPick(pool, exclude, seed)
            if (chosen) picks[`${dim}:${tier}`] = chosen.id
          }
        }
        set({ date: today, picks })
      },

      setManual: (dim, tier, sessionId) =>
        set((s) => ({ manual: { ...s.manual, [`${dim}:${tier}`]: sessionId } })),
    }),
    {
      name: 'omnifit-daily-picks',
      // Don't persist the auto picks — they recompute on load. Manual overrides DO persist.
      partialize: (s) => ({ date: s.date, manual: s.manual, recentlyDoneNames: s.recentlyDoneNames }),
    }
  )
)

// Augment the store's `picks` accessor: honour manual overrides over auto picks.
// Easier than changing all callers — re-export a thin selector below.
export function effectivePickFor(dim: Dimension, tier: Tier): string | null {
  if (tier === 'R') return null
  const t = tier as 'P' | 'S' | 'M'
  const s = useDailyPickStore.getState()
  return s.manual[`${dim}:${t}`] ?? s.picks[`${dim}:${t}`] ?? null
}

/**
 * Pure synchronous pick computation for any date — used by Plan Tomorrow,
 * Wave day-tap, and Calendar day-tap so all three agree on a (date, dim, tier).
 *
 * Exclusion is best-effort from the cache of recent completions; for past
 * dates it's slightly inaccurate but acceptable since past picks are read-only
 * historical context.
 */
export function pickSessionsForDate(
  date: Date,
  pools: Record<Dimension, Record<'P' | 'S' | 'M', Array<{ id: string; name: string }>>>
): Record<string, string> {
  const userId = useUserStore.getState().userId ?? 'anon'
  const iso = dateToISO(date)
  const seedBase = `${userId}:${iso}`
  const exclude = new Set(useDailyPickStore.getState().recentlyDoneNames)
  const out: Record<string, string> = {}
  for (const dim of Object.keys(pools) as Dimension[]) {
    for (const tier of ['P', 'S', 'M'] as const) {
      const pool = pools[dim][tier]
      const seed = hash32(`${seedBase}:${dim}:${tier}`)
      const chosen = seededPick(pool, exclude, seed)
      if (chosen) out[`${dim}:${tier}`] = chosen.id
    }
  }
  return out
}

/** Resolve picks for a specific date — falls back to today's store-cached picks
 *  when the date matches today (so manual swaps still take effect). */
export function picksForDate(
  date: Date,
  pools: Record<Dimension, Record<'P' | 'S' | 'M', Array<{ id: string; name: string }>>>
): Record<string, string> {
  const iso = dateToISO(date)
  if (iso === todayISO()) {
    const s = useDailyPickStore.getState()
    return { ...s.picks, ...s.manual }
  }
  return pickSessionsForDate(date, pools)
}
