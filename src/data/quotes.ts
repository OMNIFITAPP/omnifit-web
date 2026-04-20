export interface Quote {
  text: string
  attr: string
}

/** 7 quotes — one per day of the week, indexed by `new Date().getDay()` (0=Sun..6=Sat) */
export const QUOTES: Quote[] = [
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',                 attr: 'Aristotle' },
  { text: 'The body benefits from movement, and the mind benefits from stillness.',                      attr: 'Sakyong Mipham' },
  { text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.',              attr: 'Bruce Lee' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.',        attr: 'Anne Lamott' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.',           attr: 'Marcus Aurelius' },
  { text: 'Knowing is not enough, we must apply. Willing is not enough, we must do.',                    attr: 'Bruce Lee' },
  { text: 'Between stimulus and response there is a space. In that space is our freedom.',               attr: 'Viktor Frankl' },
]

export function todayQuote(now: Date = new Date()): Quote {
  return QUOTES[now.getDay()]
}
