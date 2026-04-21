export type Donation = { created_at: string; status?: string }

export function livesSaved(donations: Donation[]) {
  return donations.filter((d) => d.status === 'donated').length * 3
}

export function nextEligibleDate(donations: Donation[]): Date | null {
  if (!donations.length) return null
  const sorted = [...donations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const last = new Date(sorted[0].created_at)
  last.setMonth(last.getMonth() + 3)
  return last
}

export function daysUntilEligible(donations: Donation[]): number {
  const next = nextEligibleDate(donations)
  if (!next) return 0
  const diff = Math.ceil((next.getTime() - Date.now()) / 86_400_000)
  return Math.max(0, diff)
}

export type Badge = { id: string; label: string; emoji: string; earned: boolean }

export function computeBadges(donations: Donation[]): Badge[] {
  const count = donations.length
  const lives = livesSaved(donations)
  return [
    { id: 'first', label: 'First Drop', emoji: '🩸', earned: count >= 1 },
    { id: 'hero3', label: '3 Lives Saved', emoji: '💪', earned: lives >= 3 },
    { id: 'hero9', label: '9 Lives Saved', emoji: '🌟', earned: lives >= 9 },
    { id: 'hero15', label: '15 Lives Saved', emoji: '🏆', earned: lives >= 15 },
    { id: 'streak3', label: 'Consistent Donor', emoji: '🔥', earned: count >= 3 },
    { id: 'hero30', label: 'City Hero', emoji: '👑', earned: lives >= 30 },
  ]
}
