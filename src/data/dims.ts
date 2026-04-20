import type { DimConfig } from '../types'

export const DIMS: DimConfig[] = [
  { key: 'neuro',     label: 'Neurological', color: 'var(--neurological)' },
  { key: 'physical',  label: 'Physical',     color: 'var(--physical)'     },
  { key: 'cognitive', label: 'Cognitive',    color: 'var(--cognitive)'    },
  { key: 'emotional', label: 'Emotional',    color: 'var(--emotional)'    },
]

export const DIM_MAP = Object.fromEntries(DIMS.map(d => [d.key, d])) as Record<string, DimConfig>
