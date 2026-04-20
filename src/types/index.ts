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
}

export interface Session {
  name: string
  meta: string
  mantra: string
  steps: SessionStep[]
  cues: string[]
}

export type SessionsByTier = Record<'P' | 'S' | 'M', Session>
export type SessionsData = Record<Dimension, SessionsByTier>

export type DailyPlan = Record<Dimension, Tier>
export type CompletionState = Record<Dimension, boolean>
