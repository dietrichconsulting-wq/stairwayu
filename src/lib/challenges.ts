/**
 * Daily Discovery Challenge definitions.
 * Each day, 3 challenges are deterministically selected per user
 * based on a hash of userId + date.
 */

export interface ChallengeDefinition {
  key: string
  title: string
  description: string
  xpReward: number
  /** Which page to link to */
  cta: { label: string; href: string }
}

export const CHALLENGE_POOL: ChallengeDefinition[] = [
  {
    key: 'explore_new_region',
    title: 'Region Explorer',
    description: 'Use the Explore page and check a region you haven\'t looked at before.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'surprise_me',
    title: 'Feeling Lucky',
    description: 'Hit the "Surprise Me" button on the Explore page.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'stretch_mode',
    title: 'Stretch Yourself',
    description: 'Turn on Stretch mode to see what +100 SAT points opens up.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'save_from_explore',
    title: 'New Discovery',
    description: 'Save a school to your collection from the Explore page.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'browse_safety',
    title: 'Safety Net',
    description: 'Check out the Safety tier in Score Bands and find a school with great outcomes.',
    xpReward: 20,
    cta: { label: 'Go to Score Bands', href: '/score-bands' },
  },
  {
    key: 'browse_reach',
    title: 'Dream Big',
    description: 'Browse the Reach tier in Score Bands — you might surprise yourself.',
    xpReward: 20,
    cta: { label: 'Go to Score Bands', href: '/score-bands' },
  },
  {
    key: 'compare_new',
    title: 'Fresh Comparison',
    description: 'Compare two schools you haven\'t compared before.',
    xpReward: 20,
    cta: { label: 'Go to Compare', href: '/compare' },
  },
  {
    key: 'three_regions',
    title: 'Coast to Coast',
    description: 'Have schools from at least 3 different regions on your list.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'low_cost_find',
    title: 'Budget Friendly',
    description: 'Find a Target or Safety school with net cost under $15k.',
    xpReward: 20,
    cta: { label: 'Go to Score Bands', href: '/score-bands' },
  },
  {
    key: 'high_grad_rate',
    title: 'Outcomes Matter',
    description: 'Discover a school with 85%+ graduation rate.',
    xpReward: 20,
    cta: { label: 'Go to Score Bands', href: '/score-bands' },
  },
  {
    key: 'explore_slider',
    title: 'Slider DJ',
    description: 'Adjust the SAT and GPA sliders on the Explore page.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'midwest_explorer',
    title: 'Midwest Magic',
    description: 'Check the Great Lakes or Plains region and find a match.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'southeast_explorer',
    title: 'Southern Charm',
    description: 'Explore schools in the Southeast region.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
  {
    key: 'high_earnings',
    title: 'ROI Hunter',
    description: 'Find a school where grads earn $60k+ within 10 years.',
    xpReward: 20,
    cta: { label: 'Go to Score Bands', href: '/score-bands' },
  },
  {
    key: 'add_fifth_school',
    title: 'Building Options',
    description: 'Have at least 5 schools in your collection.',
    xpReward: 20,
    cta: { label: 'Go to Explore', href: '/explore' },
  },
]

/**
 * Simple deterministic hash for picking daily challenges.
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get today's 3 challenges for a given user.
 * Deterministic: same user + same date = same challenges.
 */
export function getDailyChallenges(userId: string, date: string = new Date().toISOString().slice(0, 10)): ChallengeDefinition[] {
  const seed = simpleHash(`${userId}:${date}`)
  const pool = [...CHALLENGE_POOL]
  const picks: ChallengeDefinition[] = []

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = (seed + i * 7919) % pool.length // 7919 is prime for spread
    picks.push(pool[idx])
    pool.splice(idx, 1)
  }

  return picks
}
