import type { Dimension } from '../types'

export type ShelfCategory = Dimension | 'foundation'

// Static MVP content. TODO(v2): fetch from CMS/Supabase `articles` table.
export interface ShelfArticle {
  id: string
  dim: ShelfCategory
  title: string
  readMin: number
}

export const SHELF: ShelfArticle[] = [
  { id: 'a1', dim: 'neuro',      title: 'Coordination is a cognitive skill.',         readMin: 4 },
  { id: 'a2', dim: 'physical',   title: 'Why the first ten minutes decide the rest.', readMin: 5 },
  { id: 'a3', dim: 'cognitive',  title: 'A practice of reading slowly.',              readMin: 6 },
  { id: 'a4', dim: 'emotional',  title: 'The difference between rest and avoidance.', readMin: 4 },
  { id: 'a5', dim: 'neuro',      title: 'Balance, in plain words.',                   readMin: 3 },
  { id: 'a6', dim: 'foundation', title: 'What multidimensional fitness actually means.', readMin: 6 },
  { id: 'a7', dim: 'foundation', title: 'The stress wave: train, rest, repeat.',       readMin: 5 },
]
