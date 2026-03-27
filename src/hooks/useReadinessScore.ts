import { useProfile } from './useProfile'
import { useUserColleges } from './useUserColleges'
import { useTasks } from './useTasks'
import { useMilestones, type MilestoneRecord } from './useMilestones'
import { useScholarships } from './useScholarships'
import type { Profile } from '@/lib/types/database'

const CATEGORY_WEIGHTS: Record<string, number> = {
  Applications: 1.5,
  Essays: 1.5,
  'Financial Aid': 1.3,
  Testing: 1.2,
  Recommendations: 1.2,
  Scholarships: 1.0,
  Research: 1.0,
  Visits: 0.8,
  Other: 0.8,
}

export interface ReadinessScore {
  total: number
  dimensions: {
    profile: { score: number; max: 15; items: { label: string; earned: boolean }[] }
    tasks: { score: number; max: 35; done: number; total: number }
    milestones: { score: number; max: 25; reached: number; total: 10 }
    scholarships: { score: number; max: 15; items: { label: string; earned: boolean }[] }
    momentum: { score: number; max: 10; items: { label: string; earned: boolean }[] }
  }
  isLoading: boolean
  topActions: string[]
}

function computeProfileDimension(profile: Profile | null | undefined, schoolCount: number) {

  const items = [
    { label: 'Name', earned: !!(profile?.display_name?.trim()), points: 1 },
    { label: 'GPA', earned: profile?.gpa != null || profile?.gpa_weighted != null, points: 2 },
    { label: 'SAT or ACT', earned: profile?.sat != null || profile?.act_score != null, points: 2 },
    { label: 'Major', earned: !!(profile?.proposed_major?.trim()), points: 2 },
    { label: 'Home state', earned: !!(profile?.home_state?.trim()), points: 1 },
    { label: 'Grad year', earned: profile?.grad_year != null, points: 1 },
    { label: '1+ school added', earned: schoolCount >= 1, points: 2 },
    { label: '3+ schools added', earned: schoolCount >= 3, points: 2 },
    { label: 'Preferences filled', earned: !!(profile?.desired_climate && profile?.school_size_pref && profile?.school_type_pref), points: 2 },
  ]

  const score = items.reduce((sum, i) => sum + (i.earned ? i.points : 0), 0)
  return { score, items: items.map(({ label, earned }) => ({ label, earned })) }
}

export function useReadinessScore(userId: string): ReadinessScore {
  const { data: profile, isLoading: profileLoading } = useProfile(userId)
  const { data: colleges = [], isLoading: collegesLoading } = useUserColleges(userId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId)
  const milestonesQuery = useMilestones(userId)
  const milestones: MilestoneRecord[] = milestonesQuery.data ?? []
  const milestonesLoading = milestonesQuery.isLoading
  const { data: scholarships = [], isLoading: scholarshipsLoading } = useScholarships(userId)

  const isLoading = profileLoading || collegesLoading || tasksLoading || milestonesLoading || scholarshipsLoading

  // 1. Profile (15 pts)
  const profileDim = computeProfileDimension(profile, colleges.length)

  // 2. Tasks (35 pts)
  const weightedDone = tasks
    .filter(t => t.status === 'Done')
    .reduce((sum, t) => sum + (CATEGORY_WEIGHTS[t.category] ?? 1), 0)
  const weightedTotal = tasks.reduce((sum, t) => sum + (CATEGORY_WEIGHTS[t.category] ?? 1), 0)
  const rawTaskScore = weightedTotal > 0 ? (weightedDone / weightedTotal) * 35 : 0
  const doneTasks = tasks.filter(t => t.status === 'Done').length

  // 3. Milestones (25 pts)
  const rawMilestoneScore = (milestones.length / 10) * 25

  // 4. Scholarships (15 pts)
  const scholarshipItems = [
    { label: '1+ scholarship tracked', earned: scholarships.length >= 1, points: 3 },
    { label: '3+ scholarships tracked', earned: scholarships.length >= 3, points: 3 },
    { label: '1 in Applying stage', earned: scholarships.some(s => ['Applying', 'Submitted', 'Won'].includes(s.stage)), points: 3 },
    { label: '1 submitted', earned: scholarships.some(s => ['Submitted', 'Won'].includes(s.stage)), points: 3 },
    { label: '1 won', earned: scholarships.some(s => s.stage === 'Won'), points: 3 },
  ]
  const scholarshipScore = scholarshipItems.reduce((sum, i) => sum + (i.earned ? i.points : 0), 0)

  // 5. Momentum (10 pts)
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000

  const taskDoneWeek = tasks.some(t => t.completed_at && new Date(t.completed_at).getTime() >= sevenDaysAgo)
  const taskDone48h = tasks.some(t => t.completed_at && new Date(t.completed_at).getTime() >= twoDaysAgo)
  const scholarshipUpdatedWeek = scholarships.some(s => s.updated_at && new Date(s.updated_at).getTime() >= sevenDaysAgo)
  const milestoneReachedWeek = milestones.some(m => m.reached_at && new Date(m.reached_at).getTime() >= sevenDaysAgo)

  const momentumItems = [
    { label: 'Task done this week', earned: taskDoneWeek, points: 3 },
    { label: 'Task done in 48h', earned: taskDone48h, points: 2 },
    { label: 'Scholarship updated this week', earned: scholarshipUpdatedWeek, points: 2 },
    { label: 'Milestone reached this week', earned: milestoneReachedWeek, points: 3 },
  ]
  const momentumScore = momentumItems.reduce((sum, i) => sum + (i.earned ? i.points : 0), 0)

  const total = Math.min(
    100,
    Math.max(
      0,
      Math.round(profileDim.score + rawTaskScore + rawMilestoneScore + scholarshipScore + momentumScore),
    ),
  )

  // Top actions (highest point potential first, max 3)
  const schoolCount = colleges.length

  const candidateActions: { label: string; points: number }[] = []

  if (profile?.gpa == null && profile?.gpa_weighted == null) candidateActions.push({ label: 'Add your GPA (+2 pts)', points: 2 })
  if (profile?.sat == null && profile?.act_score == null) candidateActions.push({ label: 'Add your SAT or ACT score (+2 pts)', points: 2 })
  if (!profile?.proposed_major?.trim()) candidateActions.push({ label: 'Set your intended major (+2 pts)', points: 2 })
  if (!(profile?.desired_climate && profile?.school_size_pref && profile?.school_type_pref)) {
    candidateActions.push({ label: 'Fill in your school preferences (+2 pts)', points: 2 })
  }
  if (schoolCount === 0) candidateActions.push({ label: 'Add your target schools (+2 pts)', points: 2 })
  else if (schoolCount < 3) candidateActions.push({ label: 'Add 2 more target schools (+2 pts)', points: 2 })

  if (scholarships.length === 0) {
    candidateActions.push({ label: 'Track your first scholarship (+3 pts)', points: 3 })
  } else if (!scholarships.some(s => ['Applying', 'Submitted', 'Won'].includes(s.stage))) {
    candidateActions.push({ label: 'Start applying to a scholarship (+3 pts)', points: 3 })
  }

  if (!taskDoneWeek) candidateActions.push({ label: 'Complete a task this week (+3 pts)', points: 3 })
  if (!milestoneReachedWeek) candidateActions.push({ label: 'Reach a milestone this week (+3 pts)', points: 3 })

  candidateActions.sort((a, b) => b.points - a.points)
  const topActions = candidateActions.slice(0, 3).map(a => a.label)

  return {
    total,
    dimensions: {
      profile: { score: profileDim.score, max: 15, items: profileDim.items },
      tasks: { score: Math.round(rawTaskScore), max: 35, done: doneTasks, total: tasks.length },
      milestones: { score: Math.round(rawMilestoneScore), max: 25, reached: milestones.length, total: 10 },
      scholarships: { score: scholarshipScore, max: 15, items: scholarshipItems.map(({ label, earned }) => ({ label, earned })) },
      momentum: { score: momentumScore, max: 10, items: momentumItems.map(({ label, earned }) => ({ label, earned })) },
    },
    isLoading,
    topActions,
  }
}
