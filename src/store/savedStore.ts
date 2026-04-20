import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dimension } from '../types'

export type SavedKey = `${Dimension}-${'P' | 'S' | 'M'}`

interface SavedState {
  keys: SavedKey[]
}

interface SavedActions {
  toggle: (key: SavedKey) => void
  isSaved: (key: SavedKey) => boolean
}

export const useSavedStore = create<SavedState & SavedActions>()(
  persist(
    (set, get) => ({
      keys: [],
      toggle: (key) =>
        set((s) => ({
          keys: s.keys.includes(key) ? s.keys.filter((k) => k !== key) : [...s.keys, key],
        })),
      isSaved: (key) => get().keys.includes(key),
    }),
    { name: 'omnifit-saved' }
  )
)
