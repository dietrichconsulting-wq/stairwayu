import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface MilestoneRecord {
  milestone_key: string
  reached_at: string
}

export function useMilestones(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['milestones', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('progress')
        .select('milestone_key, reached_at')
        .eq('user_id', userId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((r: any) => ({ milestone_key: r.milestone_key as string, reached_at: r.reached_at as string }))
    },
    enabled: !!userId,
  })
}

export function useMarkMilestone(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (key: string) => {
      const current = queryClient.getQueryData<MilestoneRecord[]>(['milestones', userId]) ?? []
      if (current.some(m => m.milestone_key === key)) {
        // Unmark
        await supabase.from('progress').delete().eq('user_id', userId).eq('milestone_key', key)
      } else {
        // Mark
        await supabase.from('progress').insert({ user_id: userId, milestone_key: key, reached_at: new Date().toISOString() })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', userId] })
    },
  })
}
