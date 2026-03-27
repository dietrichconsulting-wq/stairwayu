'use client'

import Link from 'next/link'

interface TrialBannerProps {
  status: string | null
  trialEnd: string | null
  tier: string | null
}

export function TrialBanner({ status, trialEnd, tier }: TrialBannerProps) {
  if (status !== 'trialing' || !trialEnd) return null

  const now = new Date()
  const end = new Date(trialEnd)
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  if (daysLeft <= 0) return null

  const urgencyColor = daysLeft <= 2
    ? 'bg-red-50 border-red-200 text-red-800'
    : daysLeft <= 4
    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
    : 'bg-blue-50 border-blue-200 text-blue-800'

  const badgeColor = daysLeft <= 2
    ? 'bg-red-100 text-red-700'
    : daysLeft <= 4
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-700'

  return (
    <div className={`${urgencyColor} border rounded-lg px-4 py-3 flex items-center justify-between mb-4`}>
      <div className="flex items-center gap-3">
        <span className={`${badgeColor} text-xs font-semibold px-2 py-1 rounded-full`}>
          FREE TRIAL
        </span>
        <span className="text-sm font-medium">
          {daysLeft === 1 ? '1 day' : `${daysLeft} days`} left in your free trial
          {daysLeft <= 3 && <span style={{ color: '#16a34a', fontWeight: 700 }}> · Save 34% with annual</span>}
        </span>
      </div>
      <Link
        href="/upgrade"
        className="text-sm font-semibold px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Subscribe Now
      </Link>
    </div>
  )
}
