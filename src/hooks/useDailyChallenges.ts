import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getDailyChallenges, type ChallengeDefinition } from '@/lib/challenges'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function useDailyChallenges(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const today = todayStr()

  const challenges = getDailyChallenges(userId, today)

  const completionsQuery = useQuery({
    queryKey: ['challenge_completions', userId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_completions')
        .select('challenge_key')
        .eq('user_id', userId)
        .eq('challenge_date', today)
      if (error) throw error
      return new Set((data ?? []).map((r: { challenge_key: string }) => r.challenge_key))
    },
    enabled: !!userId,
  })

  const completeMutation = useMutation({
    mutationFn: async (challengeKey: string) => {
      // Insert completion
      const { error: compError } = await supabase
        .from('challenge_completions')
        .upsert(
          { user_id: userId, challenge_key: challengeKey, challenge_date: today },
          { onConflict: 'user_id,challenge_key,challenge_date' },
        )
      if (compError) throw compError

      // Award XP (deduped by challenge_key + date)
      await supabase.rpc('record_xp', {
        p_action: 'complete_challenge',
        p_ref_id: `${challengeKey}_${today}`,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge_completions', userId, today] })
      queryClient.invalidateQueries({ queryKey: ['xp', userId] })
    },
  })

  const completedKeys = completionsQuery.data ?? new Set<string>()

  return {
    challenges,
    completedKeys,
    completeChallenge: completeMutation.mutate,
    isLoading: completionsQuery.isLoading,
  }
}
