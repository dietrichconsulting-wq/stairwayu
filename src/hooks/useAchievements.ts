import { useMemo } from 'react'
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/lib/achievements'
import { useReadinessScore } from './useReadinessScore'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface AchievementRpcResult {
  tasks_completed: number
  essay_actions: number
  schools_compared: number
  scholarships_tracked: number
  strategy_generated: boolean
  milestones_reached: number
  total_xp: number
  challenges_completed: number
  streak: number
}

export function useAchievements(userId: string) {
  const supabase = createClient()
  const { total: readinessScore } = useReadinessScore(userId)

  const { data: rpc } = useQuery({
    queryKey: ['achievement-context', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_achievement_context')
      if (error) throw error
      return data as AchievementRpcResult
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // achievements change infrequently; 5 min stale
  })

  const ctx: AchievementContext = useMemo(() => ({
    tasksCompleted: rpc?.tasks_completed ?? 0,
    essayActions: rpc?.essay_actions ?? 0,
    schoolsCompared: rpc?.schools_compared ?? 0,
    scholarshipsTracked: rpc?.scholarships_tracked ?? 0,
    strategyGenerated: rpc?.strategy_generated ?? false,
    milestonesReached: rpc?.milestones_reached ?? 0,
    totalXp: rpc?.total_xp ?? 0,
    streak: rpc?.streak ?? 0,
    readinessScore,
    challengesCompleted: rpc?.challenges_completed ?? 0,
  }), [rpc, readinessScore])

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
