import { useQuery } from '@tanstack/react-query'

export type UsageData = {
  used: number
  limit: number | null       // null = unlimited (Pro)
  remaining: number | null   // null = unlimited (Pro)
  isPro: boolean
  dailyLimit: number | null
}

/** @deprecated Renamed to useUsage — this alias exists for backward compat */
export function useCredits() {
  return useUsage()
}

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch('/api/credits')
      if (!res.ok) throw new Error('Failed to fetch usage')
      return res.json()
    },
  })
}
