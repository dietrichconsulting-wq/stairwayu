export interface Achievement {
  key: string
  label: string
  emoji: string
  description: string
  /** Function to check if the achievement is earned */
  check: (ctx: AchievementContext) => boolean
}

export interface AchievementContext {
  /** Number of completed tasks */
  tasksCompleted: number
  /** Number of essays brainstormed or critiqued */
  essayActions: number
  /** Number of schools compared (user_colleges count) */
  schoolsCompared: number
  /** Number of scholarships tracked */
  scholarshipsTracked: number
  /** Whether strategy has been generated at least once */
  strategyGenerated: boolean
  /** Number of milestones reached */
  milestonesReached: number
  /** Total XP earned */
  totalXp: number
  /** Current streak */
  streak: number
  /** Readiness score */
  readinessScore: number
  /** Number of daily challenges completed (all-time) */
  challengesCompleted: number
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'first_essay',
    label: 'First Essay Draft',
    emoji: '✍️',
    description: 'Brainstormed or critiqued your first essay',
    check: ctx => ctx.essayActions >= 1,
  },
  {
    key: 'schools_compared_5',
    label: '5 Schools Compared',
    emoji: '🏅',
    description: 'Added 5 schools to your dashboard',
    check: ctx => ctx.schoolsCompared >= 5,
  },
  {
    key: 'scholarship_hunter',
    label: 'Scholarship Hunter',
    emoji: '🏆',
    description: 'Started tracking your first scholarship',
    check: ctx => ctx.scholarshipsTracked >= 1,
  },
  {
    key: 'strategy_master',
    label: 'Strategy Master',
    emoji: '⚡',
    description: 'Generated your first college strategy list',
    check: ctx => ctx.strategyGenerated,
  },
  {
    key: 'task_crusher_10',
    label: 'Task Crusher',
    emoji: '💪',
    description: 'Completed 10 tasks',
    check: ctx => ctx.tasksCompleted >= 10,
  },
  {
    key: 'streak_3',
    label: 'On a Roll',
    emoji: '🔥',
    description: 'Maintained a 3-day streak',
    check: ctx => ctx.streak >= 3,
  },
  {
    key: 'streak_7',
    label: 'Unstoppable',
    emoji: '⚡',
    description: 'Maintained a 7-day streak',
    check: ctx => ctx.streak >= 7,
  },
  {
    key: 'halfway_ready',
    label: 'Halfway There',
    emoji: '🎯',
    description: 'Reached 50% readiness score',
    check: ctx => ctx.readinessScore >= 50,
  },
  {
    key: 'fully_ready',
    label: 'College Ready',
    emoji: '🎓',
    description: 'Reached 90% readiness score',
    check: ctx => ctx.readinessScore >= 90,
  },
  {
    key: 'milestone_5',
    label: 'Milestone Maven',
    emoji: '🗺️',
    description: 'Reached 5 journey milestones',
    check: ctx => ctx.milestonesReached >= 5,
  },
  {
    key: 'xp_500',
    label: 'XP Veteran',
    emoji: '⭐',
    description: 'Earned 500 XP total',
    check: ctx => ctx.totalXp >= 500,
  },
  {
    key: 'schools_compared_10',
    label: 'College Connoisseur',
    emoji: '🎒',
    description: 'Added 10 schools to compare',
    check: ctx => ctx.schoolsCompared >= 10,
  },
  {
    key: 'challenge_first',
    label: 'Challenge Accepted',
    emoji: '🎲',
    description: 'Completed your first daily challenge',
    check: ctx => ctx.challengesCompleted >= 1,
  },
  {
    key: 'challenge_streak_5',
    label: 'Challenge Champion',
    emoji: '🏅',
    description: 'Completed daily challenges on 5 different days',
    check: ctx => ctx.challengesCompleted >= 5,
  },
]
