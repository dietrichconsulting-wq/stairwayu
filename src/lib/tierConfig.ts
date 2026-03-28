export type Tier = 'reach' | 'target' | 'safety'

export function chanceToTier(chance: number): Tier {
  if (chance >= 65) return 'safety'
  if (chance >= 35) return 'target'
  return 'reach'
}

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'

export function getTierConfig() {
  return isDark()
    ? {
        reach:  { label: 'Reach'  as const, emoji: '\u{1F680}', color: '#FCA5A5', bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.18)' },
        target: { label: 'Target' as const, emoji: '\u{1F3AF}', color: '#FDE68A', bg: 'rgba(253,230,138,0.08)', border: 'rgba(253,230,138,0.18)' },
        safety: { label: 'Safety' as const, emoji: '\u2705',    color: '#86EFAC', bg: 'rgba(134,239,172,0.08)', border: 'rgba(134,239,172,0.18)' },
      }
    : {
        reach:  { label: 'Reach'  as const, emoji: '\u{1F680}', color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)'  },
        target: { label: 'Target' as const, emoji: '\u{1F3AF}', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
        safety: { label: 'Safety' as const, emoji: '\u2705',    color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)'  },
      }
}

export const REGION_LABELS: Record<number, string> = {
  1: 'New England',
  2: 'Mid-Atlantic',
  3: 'Great Lakes',
  4: 'Plains',
  5: 'Southeast',
  6: 'Southwest',
  7: 'Rocky Mountains',
  8: 'Far West',
}
