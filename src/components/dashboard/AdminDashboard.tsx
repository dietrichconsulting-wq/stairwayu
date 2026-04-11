'use client'

import { useState, useEffect, useCallback } from 'react'

type TierRow = {
  account_tier: string
  subscription_status: string | null
  user_count: number
}

type AiUsageRow = {
  account_tier: string
  usage_date: string
  active_users: number
  total_calls: number
}

type RecentSignup = {
  id: string
  display_name: string | null
  account_tier: string
  created_at: string
}

type TopAiUser = {
  user_id: string
  display_name: string | null
  account_tier: string
  total_calls: number
}

type AdminData = {
  tierBreakdown: TierRow[]
  aiUsage30d: AiUsageRow[]
  totalUsers: number
  recentSignups: RecentSignup[]
  topAiUsers: TopAiUser[]
}

const TIER_COLORS: Record<string, string> = {
  admin: '#A78BFA',
  pilot_free: '#38BDF8',
  paid: '#22C55E',
  free: '#94A3B8',
}

const TIER_LABELS: Record<string, string> = {
  admin: 'Admin',
  pilot_free: 'Pilot',
  paid: 'Paid',
  free: 'Free',
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin')
      if (!res.ok) throw new Error('Failed to load admin data')
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-[var(--color-danger)]">
        {error || 'Failed to load data'}
      </div>
    )
  }

  // Aggregate tier counts for the summary cards
  const tierTotals = data.tierBreakdown.reduce<Record<string, number>>((acc, row) => {
    acc[row.account_tier] = (acc[row.account_tier] || 0) + row.user_count
    return acc
  }, {})

  // Total AI calls today
  const today = new Date().toISOString().slice(0, 10)
  const todayUsage = data.aiUsage30d
    .filter(r => r.usage_date === today)
    .reduce((sum, r) => sum + r.total_calls, 0)

  // Last 7 days total
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const last7dUsage = data.aiUsage30d
    .filter(r => r.usage_date >= sevenDaysAgo)
    .reduce((sum, r) => sum + r.total_calls, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Admin Dashboard</h1>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-column)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Users" value={data.totalUsers} />
        <SummaryCard label="AI Calls Today" value={todayUsage} />
        <SummaryCard label="AI Calls (7d)" value={last7dUsage} />
        <SummaryCard
          label="Pilot Users"
          value={tierTotals['pilot_free'] || 0}
          color={TIER_COLORS.pilot_free}
        />
      </div>

      {/* Tier breakdown */}
      <Section title="Users by Tier">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(tierTotals).map(([tier, count]) => (
            <div
              key={tier}
              className="rounded-xl p-4 bg-[var(--color-card)] border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: TIER_COLORS[tier] || '#94A3B8' }}
                />
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {TIER_LABELS[tier] || tier}
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text)]">{count}</div>
            </div>
          ))}
        </div>

        {/* Detailed breakdown table */}
        <div className="mt-4 rounded-xl overflow-hidden border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-column)]">
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">Tier</th>
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">Subscription Status</th>
                <th className="text-right p-3 font-medium text-[var(--color-text-muted)]">Users</th>
              </tr>
            </thead>
            <tbody>
              {data.tierBreakdown.map((row, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  <td className="p-3 text-[var(--color-text)]">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: TIER_COLORS[row.account_tier] || '#94A3B8' }}
                      />
                      {TIER_LABELS[row.account_tier] || row.account_tier}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {row.subscription_status || 'none'}
                  </td>
                  <td className="p-3 text-right font-mono text-[var(--color-text)]">{row.user_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* AI usage chart (simple bar chart) */}
      <Section title="AI Usage (Last 30 Days)">
        <AiUsageChart data={data.aiUsage30d} />
      </Section>

      {/* Top AI users */}
      <Section title="Top AI Users (Last 7 Days)">
        <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-column)]">
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">User</th>
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">Tier</th>
                <th className="text-right p-3 font-medium text-[var(--color-text-muted)]">AI Calls</th>
              </tr>
            </thead>
            <tbody>
              {data.topAiUsers.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-[var(--color-text-muted)]">No AI usage yet</td></tr>
              ) : (
                data.topAiUsers.map((u, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="p-3 text-[var(--color-text)]">
                      {u.display_name || u.user_id.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ background: TIER_COLORS[u.account_tier] || '#94A3B8' }}
                      >
                        {TIER_LABELS[u.account_tier] || u.account_tier}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[var(--color-text)]">{u.total_calls}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Recent signups */}
      <Section title="Recent Signups (Last 14 Days)">
        <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-column)]">
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--color-text-muted)]">Tier</th>
                <th className="text-right p-3 font-medium text-[var(--color-text-muted)]">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-[var(--color-text-muted)]">No recent signups</td></tr>
              ) : (
                data.recentSignups.map((u) => (
                  <tr key={u.id} className="border-t border-[var(--color-border)]">
                    <td className="p-3 text-[var(--color-text)]">
                      {u.display_name || u.id.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ background: TIER_COLORS[u.account_tier] || '#94A3B8' }}
                      >
                        {TIER_LABELS[u.account_tier] || u.account_tier}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[var(--color-text-muted)]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl p-4 bg-[var(--color-card)] border border-[var(--color-border)]" style={color ? { borderColor: color + '40' } : undefined}>
      <div className="text-sm text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color: color || 'var(--color-text)' }}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">{title}</h2>
      {children}
    </section>
  )
}

function AiUsageChart({ data }: { data: AiUsageRow[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-[var(--color-text-muted)]">No AI usage data yet</div>
  }

  // Group by date, sum calls across tiers
  const byDate = data.reduce<Record<string, { total: number; byTier: Record<string, number> }>>((acc, row) => {
    if (!acc[row.usage_date]) acc[row.usage_date] = { total: 0, byTier: {} }
    acc[row.usage_date].total += row.total_calls
    acc[row.usage_date].byTier[row.account_tier] = (acc[row.usage_date].byTier[row.account_tier] || 0) + row.total_calls
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()
  const maxCalls = Math.max(...dates.map(d => byDate[d].total), 1)

  return (
    <div className="rounded-xl p-4 bg-[var(--color-card)] border border-[var(--color-border)]">
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        {Object.entries(TIER_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: TIER_COLORS[key] }} />
            <span className="text-[var(--color-text-muted)]">{label}</span>
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-[2px] h-40">
        {dates.map(date => {
          const entry = byDate[date]
          const tiers = ['admin', 'pilot_free', 'paid', 'free'] // stack order
          const heightPct = (entry.total / maxCalls) * 100

          return (
            <div
              key={date}
              className="flex-1 flex flex-col justify-end group relative"
              style={{ height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-[var(--color-text)] text-[var(--color-bg)] text-xs rounded px-2 py-1 whitespace-nowrap">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {entry.total} calls
              </div>

              {/* Stacked bar */}
              <div className="w-full rounded-t-sm overflow-hidden" style={{ height: `${heightPct}%` }}>
                {tiers.map(tier => {
                  const tierCalls = entry.byTier[tier] || 0
                  if (tierCalls === 0) return null
                  const tierPct = (tierCalls / entry.total) * 100
                  return (
                    <div
                      key={tier}
                      style={{ height: `${tierPct}%`, background: TIER_COLORS[tier] }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels (every 5th day) */}
      <div className="flex gap-[2px] mt-1">
        {dates.map((date, i) => (
          <div key={date} className="flex-1 text-center">
            {i % 5 === 0 ? (
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
