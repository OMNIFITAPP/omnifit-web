// Static MVP content. TODO(v2): fetch from CMS/Supabase `talks` table keyed by ISO week.
import type { ShelfDimension } from '../content/shelf-articles'

export interface WeeklyTalk {
  id: string
  weekOfIso: string                // Monday of the week (yyyy-mm-dd)
  coach: string
  title: string
  minutes: number
  body: string                     // read-or-listen body copy
  dimension: ShelfDimension
}

export const TALKS: WeeklyTalk[] = [
  {
    id: 'talk-2026-04-20',
    weekOfIso: '2026-04-20',
    coach: 'Sarah Lindgren',
    title: 'The quiet work of returning.',
    minutes: 6,
    body:
      'Practice is less about momentum than return. The session you begin after a missed week is worth more than any streak. Returning is the skill we are building, underneath all four dimensions.',
    dimension: 'foundations',
  },
]

export const CURRENT_TALK = TALKS[0]
