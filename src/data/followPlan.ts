import type { DailyPlan, Dimension, Tier } from '../types'
import { DIMS } from './dims'

// Tier slots by day-of-week (0=Sun … 6=Sat). Slot 0 always goes to focusDim.
const DOW_TIERS: Record<number, Tier[]> = {
  0: ['M', 'M', 'M', 'M'],  // Sun — recovery
  1: ['P', 'P', 'S', 'S'],  // Mon
  2: ['P', 'S', 'S', 'M'],  // Tue
  3: ['P', 'P', 'S', 'S'],  // Wed
  4: ['P', 'S', 'S', 'M'],  // Thu
  5: ['P', 'P', 'S', 'S'],  // Fri
  6: ['P', 'S', 'M', 'M'],  // Sat
}

export function followPlanFor(
  focusDim: Dimension | null,
  activeDims: Dimension[],
  date: Date = new Date()
): DailyPlan {
  const tiers = DOW_TIERS[date.getDay()]
  const allDims = DIMS.map((d) => d.key as Dimension)
  const focus = focusDim && activeDims.includes(focusDim) ? focusDim : activeDims[0] ?? null
  const others = allDims.filter((d) => d !== focus)

  const result = {} as DailyPlan
  let slot = 0
  if (focus) result[focus] = tiers[slot++]
  for (const d of others) {
    result[d] = activeDims.includes(d) ? (tiers[slot++] ?? 'M') : 'M'
  }
  return result
}

export function planSubtitle(
  plan: DailyPlan,
  activeDims: Dimension[],
  date: Date = new Date()
): string {
  if (date.getDay() === 0) return 'Recovery day. The wave asks for stillness.'

  const tiers = activeDims.map((d) => plan[d])
  const nP = tiers.filter((t) => t === 'P').length
  const nS = tiers.filter((t) => t === 'S').length
  const nM = tiers.filter((t) => t === 'M').length
  const restLabels = DIMS
    .filter((d) => activeDims.includes(d.key as Dimension) && plan[d.key as Dimension] === 'R')
    .map((d) => d.label)

  if (restLabels.length > 0) return `${activeDims.length - restLabels.length} dimensions today. ${restLabels.join(', ')} rests.`
  if (nP >= 3) return 'A strong day. Three Primaries and a push.'
  if (nP === 2 && nS === 2) return 'Balanced. Depth and maintenance together.'
  if (nP === 2 && nM >= 1) return 'Depth and light touches. A focused day.'
  if (nM === activeDims.length) return 'Micro day. Small touches, real effect.'
  if (nP <= 1 && nM >= 2) return 'A lighter day. Restore and maintain.'
  return 'The day is yours to practice.'
}
