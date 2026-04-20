export interface TourStep {
  /** Value of the data-tour attribute on the target element */
  target: string
  title: string
  description: string
  /** Preferred tooltip placement relative to target */
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'readiness-score',
    title: 'Your Readiness Score',
    description:
      'This tracks how prepared you are across profile, tasks, milestones, scholarships, and momentum. Your goal is to get it to 100%.',
    placement: 'left',
  },
  {
    target: 'whats-next',
    title: 'Your Journey',
    description:
      'This card shows your next milestone. Tap it to see your full roadmap and track progress phase by phase.',
    placement: 'bottom',
  },
  {
    target: 'nav-explore',
    title: 'Explore Schools',
    description:
      'Slide your SAT and GPA to instantly discover matching schools. Try Stretch mode to see what studying harder unlocks, or hit Surprise Me to find hidden gems.',
    placement: 'right',
  },
  {
    target: 'nav-score-bands',
    title: 'Score Bands',
    description:
      'See schools grouped into Reach, Target, and Safety tiers based on your actual stats. Sort by cost, grad rate, or earnings to find the best fit.',
    placement: 'right',
  },
  {
    target: 'daily-challenges',
    title: 'Daily Challenges',
    description:
      'Complete 3 fresh challenges each day to earn XP and discover schools you never thought to look at. Explore new regions, try different scores, and build a balanced list.',
    placement: 'bottom',
  },
  {
    target: 'nav-strategy',
    title: 'AI Strategy',
    description:
      'Get a personalized reach / target / safety school list powered by AI, based on your GPA, test scores, and major. Free users get 3 AI calls per day — Pro is unlimited.',
    placement: 'right',
  },
  {
    target: 'nav-essays',
    title: 'Essays & Scholarships',
    description:
      'Two tools: Brainstorm generates essay topic ideas for each school. Critique scores your draft and tells you what to fix. You write every word — AI helps you think. Each use costs one AI call.',
    placement: 'right',
  },
  {
    target: 'quick-actions',
    title: 'Tasks & Quick Actions',
    description:
      'Your to-do list is pre-loaded with college prep tasks. Complete them to boost your readiness score and unlock achievements.',
    placement: 'top',
  },
]
