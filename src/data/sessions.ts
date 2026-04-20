import sessionsJson from './sessions.json'
import type { Dimension, Session, Tier } from '../types'

// Narrow the JSON import to our types
type SessionsFile = Record<Dimension, Record<'P' | 'S' | 'M', SessionJson>>

interface SessionJson {
  name: string
  durationMin: number
  tierLabel: string
  focus: string
  mantra: string
  cues: string[]
  steps: Array<{ text: string; mode: 'auto' | 'tap' | 'rest'; seconds?: number }>
}

const DATA = sessionsJson as SessionsFile

/** Full session including the prototype-style `meta` string ("20 min · Primary · Coordination") */
export function getSession(dim: Dimension, tier: 'P' | 'S' | 'M'): Session & {
  durationMin: number
  tierLabel: string
  focus: string
} {
  const s = DATA[dim][tier]
  return {
    name: s.name,
    durationMin: s.durationMin,
    tierLabel: s.tierLabel,
    focus: s.focus,
    meta: `${s.durationMin} min · ${s.tierLabel} · ${s.focus}`,
    mantra: s.mantra,
    cues: s.cues,
    steps: s.steps,
  }
}

/** Short, one-line description for each tier — used in the swap sheet */
export const TIER_DESCRIPTIONS: Record<'P' | 'S' | 'M', string> = {
  P: 'Full session, higher demand.',
  S: 'Lighter load, same quality.',
  M: 'Just a few minutes.',
}

/** Human-readable label for any tier value (including Rest) */
export const TIER_LABELS: Record<Tier, string> = {
  P: 'Primary',
  S: 'Secondary',
  M: 'Micro',
  R: 'Rest',
}
