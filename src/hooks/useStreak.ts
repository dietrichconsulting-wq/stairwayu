import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef } from 'react'

interface StreakData {
  streak: number
  isLoading: boolean
}

/**
 * Records today's visit and computes the current consecutive-day streak.
 *
 * How it works:
 * 1. On mount, upserts today's date into `daily_activity` (one row per user per day).
 * 2. Fetches the last 365 activity dates and walks backwards from today
 *    counting consecutive calendar days.
 */
export function useStreak(userId: string): StreakData {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const recorded = useRef(false)

  // Record today's activity (fire-and-forget, once per mount)
  useEffect(() => {
    if (!userId || recorded.current) return
    recorded.current = true

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    supabase
      .from('daily_activity')
      .upsert(
        { user_id: userId, activity_date: today },
        { onConflict: 'user_id,activity_date' },
      )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['streak', userId] })
      })
  }, [userId, supabase, queryClient])

  const query = useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_activity')
        .select('activity_date')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false })
        .limit(365)

      if (error) throw error

      if (!data || data.length === 0) return 0

      // Walk backwards from today counting consecutive days
      const dates = new Set(data.map((r: { activity_date: string }) => r.activity_date))
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let streak = 0
      const cursor = new Date(today)

      // If the user hasn't logged in today yet, start counting from yesterday
      const todayStr = cursor.toISOString().slice(0, 10)
      if (!dates.has(todayStr)) {
        cursor.setDate(cursor.getDate() - 1)
      }

      while (true) {
        const dateStr = cursor.toISOString().slice(0, 10)
        if (dates.has(dateStr)) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }

      return streak
    },
    enabled: !!userId,
  })

  return {
    streak: query.data ?? 0,
    isLoading: query.isLoading,
  }
}
