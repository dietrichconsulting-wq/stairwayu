import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { XpAction } from '@/lib/types/database'

// ── XP rewards per action ──
export const XP_REWARDS: Record<XpAction, number> = {
  complete_task: 10,
  mark_milestone: 30,
  generate_strategy: 50,
  essay_brainstorm: 25,
  essay_critique: 25,
  add_scholarship: 15,
  add_college: 10,
  refer_friend: 50,
}

// ── Level thresholds ──
const LEVEL_THRESHOLDS = [
  0,     // Level 1
  50,    // Level 2
  150,   // Level 3
  300,   // Level 4
  500,   // Level 5
  750,   // Level 6
  1100,  // Level 7
  1500,  // Level 8
  2000,  // Level 9
  2750,  // Level 10
]

export function getLevel(totalXp: number) {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null // null = max level
  const xpIntoLevel = totalXp - currentThreshold
  const xpForNextLevel = nextThreshold !== null ? nextThreshold - currentThreshold : null

  return { level, xpIntoLevel, xpForNextLevel, isMaxLevel: nextThreshold === null }
}

export interface XpData {
  totalXp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number | null
  isMaxLevel: boolean
  isLoading: boolean
}

export function useXp(userId: string): XpData {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['xp', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xp_ledger')
        .select('xp')
        .eq('user_id', userId)

      if (error) throw error
      return (data ?? []).reduce((sum: number, r: { xp: number }) => sum + r.xp, 0)
    },
    enabled: !!userId,
  })

  const totalXp = query.data ?? 0
  const levelData = getLevel(totalXp)

  return {
    totalXp,
    ...levelData,
    isLoading: query.isLoading,
  }
}

/**
 * Mutation to record an XP-earning event.
 * Uses ref_id to deduplicate (e.g. same task can't earn XP twice).
 */
export function useRecordXp(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ action, refId }: { action: XpAction; refId?: string }) => {
      const xp = XP_REWARDS[action]
      const { error } = await supabase
        .from('xp_ledger')
        .upsert(
          { user_id: userId, action, xp, ref_id: refId ?? null },
          { onConflict: 'user_id,action,ref_id' },
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xp', userId] })
    },
  })
}
