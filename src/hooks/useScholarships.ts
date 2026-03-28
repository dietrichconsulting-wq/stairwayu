import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Scholarship, ScholarshipStage } from '@/lib/types/database'
import { XP_REWARDS } from './useXp'

export function useScholarships(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['scholarships', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as Scholarship[]
    },
    enabled: !!userId,
  })
}

export function useCreateScholarship(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (scholarship: Omit<Scholarship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('scholarships')
        .insert({ ...scholarship, user_id: userId })
        .select()
        .single()
      if (error) throw error

      // Award XP for adding a scholarship (deduped by id)
      await supabase.from('xp_ledger').upsert(
        { user_id: userId, action: 'add_scholarship', xp: XP_REWARDS.add_scholarship, ref_id: data.id },
        { onConflict: 'user_id,action,ref_id' },
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scholarships', userId] })
      queryClient.invalidateQueries({ queryKey: ['xp', userId] })
    },
  })
}

export function useUpdateScholarship(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Scholarship> & { id: string }) => {
      const { data, error } = await supabase
        .from('scholarships')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scholarships', userId] }),
  })
}

export function useDeleteScholarship(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scholarships').delete().eq('id', id).eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scholarships', userId] }),
  })
}
