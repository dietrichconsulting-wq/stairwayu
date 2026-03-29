import { useQuery } from '@tanstack/react-query'

export type CreditsData = {
  balance: number
  callsRemaining: number
  creditsPerCall: number
}

export function useCredits() {
  return useQuery<CreditsData>({
    queryKey: ['credits'],
    queryFn: async () => {
      const res = await fetch('/api/credits')
      if (!res.ok) throw new Error('Failed to fetch credits')
      return res.json()
    },
  })
}
