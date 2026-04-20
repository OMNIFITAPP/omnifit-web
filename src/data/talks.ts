// Static MVP content. TODO(v2): fetch from CMS/Supabase `talks` table keyed by ISO week.
export interface WeeklyTalk {
  weekOfIso: string        // Monday of the week (yyyy-mm-dd)
  coach: string
  title: string
  minutes: number
  body: string             // read-or-listen body copy
}

export const CURRENT_TALK: WeeklyTalk = {
  weekOfIso: '2026-04-20',
  coach: 'Sarah Lindgren',
  title: 'The quiet work of returning.',
  minutes: 6,
  body:
    'Practice is less about momentum than return. The session you begin after a missed week is worth more than any streak. Returning is the skill we are building, underneath all four dimensions.',
}
