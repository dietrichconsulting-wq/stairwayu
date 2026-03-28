import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/lib/types/database'
import { XP_REWARDS } from './useXp'

export function useTasks(userId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!userId,
  })
}

export function useUpdateTaskStatus(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const updates: Partial<Task> = { status }
      if (status === 'Done') updates.completed_at = new Date().toISOString()
      else updates.completed_at = null

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error

      // Award XP for completing a task (deduped by ref_id)
      if (status === 'Done') {
        await supabase.from('xp_ledger').upsert(
          { user_id: userId, action: 'complete_task', xp: XP_REWARDS.complete_task, ref_id: taskId },
          { onConflict: 'user_id,action,ref_id' },
        )
      }

      return data
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
      const prev = queryClient.getQueryData<Task[]>(['tasks', userId])
      queryClient.setQueryData<Task[]>(['tasks', userId], old =>
        old?.map(t => t.id === taskId ? { ...t, status } : t) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['tasks', userId], ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
      queryClient.invalidateQueries({ queryKey: ['xp', userId] })
    },
  })
}

export function useCreateTask(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
  })
}

export function useDeleteTask(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
  })
}

export function useUpdateTask(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
  })
}

export function useSeedTasks(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('seed_default_tasks', { p_user_id: userId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
  })
}
