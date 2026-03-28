import { useMemo } from 'react'
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/lib/achievements'
import { useTasks } from './useTasks'
import { useUserColleges } from './useUserColleges'
import { useMilestones } from './useMilestones'
import { useXp } from './useXp'
import { useStreak } from './useStreak'
import { useReadinessScore } from './useReadinessScore'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useAchievements(userId: string) {
  const { data: tasks = [] } = useTasks(userId)
  const { data: colleges = [] } = useUserColleges(userId)
  const milestonesQuery = useMilestones(userId)
  const xpData = useXp(userId)
  const { streak } = useStreak(userId)
  const { total: readinessScore } = useReadinessScore(userId)

  const supabase = createClient()

  // Count essay actions from xp_ledger
  const essayQuery = useQuery({
    queryKey: ['essay-actions', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('xp_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('action', ['essay_brainstorm', 'essay_critique'])
      return count ?? 0
    },
    enabled: !!userId,
  })

  // Check if strategy was ever generated (via xp_ledger)
  const strategyQuery = useQuery({
    queryKey: ['strategy-generated', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('xp_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', 'generate_strategy')
      return (count ?? 0) > 0
    },
    enabled: !!userId,
  })

  // Count scholarships
  const scholarshipQuery = useQuery({
    queryKey: ['scholarship-count', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('scholarships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count ?? 0
    },
    enabled: !!userId,
  })

  // Count challenge completions (all-time, distinct days)
  const challengeQuery = useQuery({
    queryKey: ['challenge-completions-count', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('challenge_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      return count ?? 0
    },
    enabled: !!userId,
  })

  const ctx: AchievementContext = useMemo(() => ({
    tasksCompleted: tasks.filter(t => t.status === 'Done').length,
    essayActions: essayQuery.data ?? 0,
    schoolsCompared: colleges.length,
    scholarshipsTracked: scholarshipQuery.data ?? 0,
    strategyGenerated: strategyQuery.data ?? false,
    milestonesReached: milestonesQuery.data?.length ?? 0,
    totalXp: xpData.totalXp,
    streak,
    readinessScore,
    challengesCompleted: challengeQuery.data ?? 0,
  }), [tasks, essayQuery.data, colleges.length, scholarshipQuery.data, strategyQuery.data, milestonesQuery.data?.length, xpData.totalXp, streak, readinessScore, challengeQuery.data])

  const earned: Achievement[] = useMemo(
    () => ACHIEVEMENTS.filter(a => a.check(ctx)),
    [ctx],
  )

  const locked: Achievement[] = useMemo(
    () => ACHIEVEMENTS.filter(a => !a.check(ctx)),
    [ctx],
  )

  return { earned, locked, total: ACHIEVEMENTS.length }
}
