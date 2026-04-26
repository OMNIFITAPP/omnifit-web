import type { DailyPlan, Dimension, Tier, CompletionState } from '../types'
import { DIMS } from './dims'

export const TIER_WEIGHT: Record<Tier, number> = { P: 3, S: 2, M: 1, R: 0 }
export const MAX_DAY_WEIGHT = 12 // 4 dims × P(3)

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface WeekDay {
  date: string          // ISO yyyy-mm-dd
  label: string         // 'Mon' ..
  weekday: number       // 0=Sun..6=Sat
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

/**
 * Format a Date to yyyy-mm-dd using LOCAL date components.
 * `toISOString()` shifts to UTC, which can return the wrong day near midnight
 * for users in negative-offset timezones — that was the SUN→Sat wave bug.
 */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Monday-anchored 7-day window containing the given date. */
export function currentWeek(today: Date = new Date()): WeekDay[] {
  // Shift so Monday = 0
  const dow = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow)
  monday.setHours(0, 0, 0, 0)

  const todayIso = isoDate(today)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = isoDate(d)
    return {
      date: iso,
      label: DAY_SHORT[d.getDay()],
      weekday: d.getDay(),
      isToday: iso === todayIso,
      isPast: iso < todayIso,
      isFuture: iso > todayIso,
    }
  })
}

// ─── Deterministic seed for past days ─────────────────────────────
// Gives visually varied bar heights without persisting a history.
// TODO(v2): replace with real Supabase `user_week` history fetch.
const SEED_PATTERNS: Tier[][] = [
  ['P', 'P', 'S', 'M'],
  ['S', 'P', 'M', 'S'],
  ['M', 'S', 'P', 'P'],
  ['P', 'M', 'S', 'S'],
  ['R', 'P', 'M', 'P'],
  ['S', 'S', 'P', 'M'],
  ['M', 'P', 'P', 'S'],
]

export function seedPlanFor(dateIso: string): DailyPlan {
  const h = Array.from(dateIso).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7)
  const row = SEED_PATTERNS[h % SEED_PATTERNS.length]
  return Object.fromEntries(DIMS.map((d, i) => [d.key, row[i]])) as DailyPlan
}

export const ALL_DONE: CompletionState = {
  neuro: true,
  physical: true,
  cognitive: true,
  emotional: true,
}

export function dayWeight(plan: DailyPlan): number {
  return (DIMS as { key: Dimension }[]).reduce((sum, d) => sum + TIER_WEIGHT[plan[d.key]], 0)
}

export function completedWeight(plan: DailyPlan, checked: CompletionState): number {
  return (DIMS as { key: Dimension }[]).reduce(
    (sum, d) => sum + (checked[d.key] ? TIER_WEIGHT[plan[d.key]] : 0),
    0
  )
}

/** Qualitative reading of the week, mirroring the prototype's tone. */
export function weekReading(totals: number[]): string {
  const nonZero = totals.filter((t) => t > 0)
  if (nonZero.length === 0) return 'A fresh week — ready when you are.'
  const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length
  const variance =
    nonZero.reduce((acc, t) => acc + (t - avg) ** 2, 0) / nonZero.length
  if (avg >= 9) return 'A strong week. Keep the quality, let intensity breathe.'
  if (avg >= 6 && variance < 4) return 'Steady practice — rhythm is its own reward.'
  if (avg >= 6) return 'A varied week. The peaks are earned; honour the valleys.'
  if (avg >= 3) return 'A light week. Small reps still shape the week ahead.'
  return 'A quiet week. One session is enough to begin again.'
}
