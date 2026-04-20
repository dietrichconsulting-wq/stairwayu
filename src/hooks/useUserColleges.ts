import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserCollege } from '@/lib/types/database'

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
      if (error) {
        // DB trigger returns this for free-tier college limit
        if (error.code === 'P0001' && error.message.includes('Free plan')) {
          throw new Error('Free plan allows up to 8 colleges. Upgrade to Pro for unlimited.')
        }
        throw error
      }

      // Award XP for adding a college (deduped by id)
      await supabase.rpc('record_xp', { p_action: 'add_college', p_ref_id: data.id })

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
