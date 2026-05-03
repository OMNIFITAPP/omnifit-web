export type Dimension = 'neuro' | 'physical' | 'cognitive' | 'emotional'
export type Tier = 'P' | 'S' | 'M' | 'R'

export interface DimConfig {
  key: Dimension
  label: string
  color: string  // CSS variable reference, e.g. 'var(--neurological)'
}

export interface SessionStep {
  text: string
  mode: 'auto' | 'tap' | 'rest'
  seconds?: number
  cue?: string          // per-step contextual cue (short, italic)
}

export interface Session {
  id: string
  name: string
  durationMin: number
  category: string
  meta: string                  // "10 min · Mobility"
  mantra: string
  steps: SessionStep[]
}

export type SessionsByTier = Record<'P' | 'S' | 'M', Session>
export type SessionsData = Record<Dimension, SessionsByTier>

export type DailyPlan = Record<Dimension, Tier>
export type CompletionState = Record<Dimension, boolean>
