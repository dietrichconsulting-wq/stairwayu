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
    target: 'nav-strategy',
    title: 'AI Strategy',
    description:
      'Get a personalized reach / target / safety school list powered by AI, based on your GPA, test scores, and major.',
    placement: 'right',
  },
  {
    target: 'nav-essays',
    title: 'Essays & Scholarships',
    description:
      'Brainstorm essay ideas, get AI critiques, and discover scholarships matched to your profile — all in one place.',
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
