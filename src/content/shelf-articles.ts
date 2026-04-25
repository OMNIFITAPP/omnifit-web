// Shelf articles — long-form reading, grouped by dimension.
// Bodies for articles 2..8 are placeholders until the copy arrives.
// Keep body as a single string with "\n\n" between paragraphs.

export type ShelfDimension = 'neurological' | 'physical' | 'cognitive' | 'emotional' | 'foundations'

export interface ShelfArticleContent {
  id: string
  dimension: ShelfDimension
  title: string
  readTime: number   // minutes
  body: string
}

export const shelfArticles: ShelfArticleContent[] = [
  {
    id: 'balance-plain-words',
    dimension: 'neurological',
    title: 'Balance, in plain words.',
    readTime: 3,
    body:
      "Balance is not a gift. It is a skill the nervous system learns, practices, and can lose.\n\n" +
      "Most people think of balance as something you either have or don't. You do or don't fall. You are or aren't coordinated. This is wrong. Balance is a constant conversation between three systems: your eyes, your inner ear, and the sensory receptors in your joints and muscles. All three send signals. The brain synthesises them into a stable sense of where you are in space.\n\n" +
      "When one system weakens — through age, sedentary habit, or simply not practicing — the others have to compensate. The result is not a sudden loss of balance but a slow, invisible narrowing. You grip the railing you used to ignore. You hesitate on uneven ground. You adjust to a smaller world without noticing.\n\n" +
      "Neurological training directly addresses this. Not by making you stronger, but by keeping the conversation between these three systems active and precise.\n\n" +
      "The simplest practice: stand on one leg. Eyes open, then closed. Thirty seconds each side. Do it every day for two weeks and notice what changes. Not in the exercise itself — in how you move through a room, step off a curb, catch yourself without thinking.\n\n" +
      "Balance training is maintenance for the nervous system. Like brushing your teeth, but for your ability to move through the world confidently until you are old.\n\n" +
      "Start small. Start often. The nervous system responds to frequency more than intensity.",
  },
  {
    id: 'coordination-cognitive',
    dimension: 'neurological',
    title: 'Coordination is a cognitive skill.',
    readTime: 4,
    body: 'Body coming soon.',
  },
  {
    id: 'warmup-matters',
    dimension: 'physical',
    title: 'Why the warm-up matters.',
    readTime: 2,
    body: 'Body coming soon.',
  },
  {
    id: 'strength-as-patience',
    dimension: 'physical',
    title: 'On strength as patience.',
    readTime: 4,
    body: 'Body coming soon.',
  },
  {
    id: 'algorithm-attention',
    dimension: 'cognitive',
    title: 'What the algorithm is doing to your attention.',
    readTime: 2,
    body: 'Body coming soon.',
  },
  {
    id: 'slow-reading',
    dimension: 'cognitive',
    title: 'The case for slow reading.',
    readTime: 3,
    body: 'Body coming soon.',
  },
  {
    id: 'rest-vs-avoidance',
    dimension: 'emotional',
    title: 'The difference between rest and avoidance.',
    readTime: 2,
    body: 'Body coming soon.',
  },
  {
    id: 'four-dimensions-order',
    dimension: 'foundations',
    title: 'The four dimensions, and why the order matters.',
    readTime: 4,
    body: 'Body coming soon.',
  },
]

export function getShelfArticle(id: string): ShelfArticleContent | undefined {
  return shelfArticles.find((a) => a.id === id)
}
