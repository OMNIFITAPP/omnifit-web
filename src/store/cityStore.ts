import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CityState {
  city: string
  setCity: (c: string) => void
}

export const CITIES = ['Copenhagen', 'London', 'Berlin', 'Stockholm', 'New York', 'Lisbon'] as const

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      city: 'Copenhagen',
      setCity: (c) => set({ city: c }),
    }),
    { name: 'omnifit-city' }
  )
)
