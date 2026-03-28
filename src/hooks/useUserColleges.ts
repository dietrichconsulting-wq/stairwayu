import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserCollege } from '@/lib/types/database'
import { XP_REWARDS } from './useXp'

export function useUserColleges(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['user_colleges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_colleges')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order')
      if (error) throw error
      return data as UserCollege[]
    },
    enabled: !!userId,
  })
}

export function useAddCollege(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, collegeId }: { name: string; collegeId?: string }) => {
      // Get current max sort_order
      const { data: existing } = await supabase
        .from('user_colleges')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

      const { data, error } = await supabase
        .from('user_colleges')
        .upsert(
          { user_id: userId, college_name: name, college_id: collegeId ?? null, sort_order: nextOrder },
          { onConflict: 'user_id,college_name' },
        )
        .select()
        .single()
      if (error) throw error

      // Award XP for adding a college (deduped by id)
      await supabase.from('xp_ledger').upsert(
        { user_id: userId, action: 'add_college', xp: XP_REWARDS.add_college, ref_id: data.id },
        { onConflict: 'user_id,action,ref_id' },
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_colleges', userId] })
      queryClient.invalidateQueries({ queryKey: ['xp', userId] })
    },
  })
}

export function useRemoveCollege(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (collegeId: string) => {
      const { error } = await supabase
        .from('user_colleges')
        .delete()
        .eq('id', collegeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_colleges', userId] })
    },
  })
}

export function useUpdateCollege(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, collegeId }: { id: string; name: string; collegeId?: string }) => {
      const { data, error } = await supabase
        .from('user_colleges')
        .update({ college_name: name, college_id: collegeId ?? null })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_colleges', userId] })
    },
  })
}
