import sessionsJson from './sessions.json'
import type { Dimension, Session, SessionStep, Tier } from '../types'
import { useDailyPickStore, effectivePickFor, picksForDate } from '../store/dailyPickStore'

// ─── Raw JSON shape ───────────────────────────────────────────────
type JsonDim = 'neurological' | 'physical' | 'cognitive' | 'emotional'
type JsonTier = 'primary' | 'secondary' | 'micro'

interface JsonSession {
  id: string
  name: string
  duration_min: number
  tier: 'Primary' | 'Secondary' | 'Micro'
  category: string
  mantra: string
  steps: Array<{
    text: string
    mode: 'auto' | 'tap' | 'rest'
    seconds?: number
    cue?: string
  }>
}

type JsonFile = Record<JsonDim, Record<JsonTier, JsonSession[]>>

// ─── Aliases (B: keep `neuro` in code, accept `neurological` in JSON) ──
const DIM_FROM_JSON: Record<JsonDim, Dimension> = {
  neurological: 'neuro',
  physical:     'physical',
  cognitive:    'cognitive',
  emotional:    'emotional',
}

const DIM_TO_JSON: Record<Dimension, JsonDim> = {
  neuro:     'neurological',
  physical:  'physical',
  cognitive: 'cognitive',
  emotional: 'emotional',
}

const TIER_TO_JSON: Record<'P' | 'S' | 'M', JsonTier> = {
  P: 'primary',
  S: 'secondary',
  M: 'micro',
}

const RAW = sessionsJson as JsonFile

/** Convert one JSON record to the runtime Session type. */
function adapt(s: JsonSession): Session {
  return {
    id: s.id,
    name: s.name,
    durationMin: s.duration_min,
    category: s.category,
    meta: `${s.duration_min} min · ${s.category}`,
    mantra: s.mantra,
    steps: s.steps as SessionStep[],
  }
}

// Pre-build pools and an id index up front; cheap and the JSON never changes.
const POOLS: Record<Dimension, Record<'P' | 'S' | 'M', Session[]>> = {
  neuro:     { P: [], S: [], M: [] },
  physical:  { P: [], S: [], M: [] },
  cognitive: { P: [], S: [], M: [] },
  emotional: { P: [], S: [], M: [] },
}
const BY_ID: Record<string, Session> = {}

for (const jsonDim of Object.keys(RAW) as JsonDim[]) {
  const dim = DIM_FROM_JSON[jsonDim]
  for (const jsonTier of ['primary', 'secondary', 'micro'] as JsonTier[]) {
    const tier = (Object.entries(TIER_TO_JSON).find(([, v]) => v === jsonTier)?.[0] ?? 'M') as
      'P' | 'S' | 'M'
    for (const raw of RAW[jsonDim][jsonTier]) {
      const session = adapt(raw)
      POOLS[dim][tier].push(session)
      BY_ID[session.id] = session
    }
  }
}

/** All sessions for a (dim, tier). */
export function getPool(dim: Dimension, tier: 'P' | 'S' | 'M'): Session[] {
  return POOLS[dim][tier]
}

/** Lightweight pool descriptor for the daily-pick store — id+name only. */
export function getAllPools(): Record<Dimension, Record<'P' | 'S' | 'M', Array<{ id: string; name: string }>>> {
  const out = {} as Record<Dimension, Record<'P' | 'S' | 'M', Array<{ id: string; name: string }>>>
  for (const dim of Object.keys(POOLS) as Dimension[]) {
    out[dim] = { P: [], S: [], M: [] }
    for (const tier of ['P', 'S', 'M'] as const) {
      out[dim][tier] = POOLS[dim][tier].map((s) => ({ id: s.id, name: s.name }))
    }
  }
  return out
}

/** Look up a session by id. Returns null if no such id. */
export function getSessionById(id: string): Session | null {
  return BY_ID[id] ?? null
}

/**
 * Resolve the "active" session for a (dim, tier) — usually today's daily pick.
 * Falls back to pool[0] if the daily-pick store hasn't computed picks yet.
 */
export function getSession(dim: Dimension, tier: 'P' | 'S' | 'M'): Session {
  // Touch the store so callers that subscribe to it re-render on pick changes.
  useDailyPickStore.getState()
  const pickedId = effectivePickFor(dim, tier)
  const fromPick = pickedId ? BY_ID[pickedId] : null
  return fromPick ?? POOLS[dim][tier][0]
}

/**
 * Resolve the session for a (dim, tier) on any date. Today goes through the
 * store (honours swaps); other dates use the deterministic seed.
 */
export function getSessionForDate(
  date: Date,
  dim: Dimension,
  tier: 'P' | 'S' | 'M'
): Session {
  const picks = picksForDate(date, getAllPools())
  const id = picks[`${dim}:${tier}`]
  return (id && BY_ID[id]) || POOLS[dim][tier][0]
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

// Suppress unused-import warning (DIM_TO_JSON is exported only for future use).
export const _DIM_TO_JSON = DIM_TO_JSON
