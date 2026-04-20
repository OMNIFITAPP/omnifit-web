export interface Greeting {
  g: string   // main greeting line
  s: string   // subtitle
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Prototype-exact date label, e.g. "Sat · Apr 19" */
export function fmtDate(d: Date = new Date()): string {
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** Time-aware greeting when the day is NOT yet complete. */
export function greet(name: string, d: Date = new Date()): Greeting {
  const h = d.getHours()
  const nameStr = name || 'friend'
  if (h >= 5 && h < 11)  return { g: `Good morning, ${nameStr}.`,   s: 'The day is yours to practice.' }
  if (h >= 11 && h < 17) return { g: `Good afternoon, ${nameStr}.`, s: 'The day continues.' }
  if (h >= 17 && h < 21) return { g: `Good evening, ${nameStr}.`,   s: 'Evening practice, or let the day close.' }
  return { g: `Good night, ${nameStr}.`, s: 'The day is done. Rest is practice.' }
}

/** Time-aware greeting when all four dimensions are complete. */
export function greetDone(name: string, d: Date = new Date()): Greeting {
  const h = d.getHours()
  const nameStr = name || 'friend'
  if (h < 17) return { g: `Well practiced, ${nameStr}.`, s: "The day's four are done." }
  if (h < 21) return { g: `Good evening, ${nameStr}.`,   s: 'The practice is done.' }
  return { g: `Good night, ${nameStr}.`, s: 'The day closes. Well done.' }
}
