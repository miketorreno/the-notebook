export const GRACE_LIMIT = 2

export function dayKeyOf(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthKeyOf(date: Date): string {
  return dayKeyOf(date).slice(0, 7)
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function monthEndOf(windowStart: Date): Date {
  return new Date(windowStart.getFullYear(), windowStart.getMonth() + 1, 0)
}

/**
 * The first day of the calendar month containing `date`. Each month is a
 * grace window: the 2-day allowance resets at the month boundary.
 */
export function windowStartOf(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Missed days covered by grace so far in the current month's window: every
 * day from the month's first completion through `now` that has no completion,
 * not counting days before the month's first completion.
 */
export function graceDaysUsedInWindow(
  completionKeys: string[],
  windowStart: Date,
  now: Date,
): number {
  const end = monthEndOf(windowStart)
  const inWindow = completionKeys
    .map(keyToDate)
    .filter((date) => date >= windowStart && date <= end)
    .sort((a, b) => a.getTime() - b.getTime())
  if (inWindow.length === 0) return 0

  const first = inWindow[0].getTime()
  const through = startOfDay(new Date(Math.min(now.getTime(), end.getTime())))
  const spanDays = Math.round((through.getTime() - first) / 86_400_000) + 1
  const gaps = spanDays - inWindow.length
  return Math.max(0, gaps)
}

function sortedUniqueDays(completionKeys: string[]): Date[] {
  return [...new Set(completionKeys.map(keyToDate))].sort(
    (a, b) => a.getTime() - b.getTime(),
  )
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function countMissingBetween(a: Date, b: Date, monthKey: string): number {
  let count = 0
  const probe = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1)
  while (probe < b) {
    if (monthKeyOf(probe) === monthKey) count++
    probe.setDate(probe.getDate() + 1)
  }
  return count
}

/**
 * Can the gap between `a` (earlier) and `b` (later) be bridged by grace?
 * Records the grace days consumed per month in `usedByMonth` when it can, so
 * a single month's 2-day allowance is shared across every gap it spans.
 */
function bridgeable(
  a: Date,
  b: Date,
  usedByMonth: Map<string, number>,
): boolean {
  let missing = daysBetween(a, b) - 1
  if (missing <= 0) return true

  const months: string[] = []
  const probe = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1)
  while (probe < b && missing > 0) {
    const mk = monthKeyOf(probe)
    if (!months.includes(mk)) months.push(mk)
    probe.setDate(probe.getDate() + 1)
    missing--
  }

  const toCommit: Array<[string, number]> = []
  for (const mk of months) {
    const consumed = countMissingBetween(a, b, mk)
    const used = (usedByMonth.get(mk) ?? 0) + consumed
    if (used > GRACE_LIMIT) return false
    toCommit.push([mk, consumed])
  }

  // Only commit the consumption once every month stays within limit.
  for (const [mk, consumed] of toCommit) {
    usedByMonth.set(mk, (usedByMonth.get(mk) ?? 0) + consumed)
  }
  return true
}

/**
 * The current streak as of `now`: a streak of consecutive completed days that
 * stays alive while the gap back to the most recent completion fits within
 * the monthly grace allowance. Only completed days are counted, so a missed
 * day never inflates the number — it just keeps the streak alive until grace
 * runs out.
 */
export function currentStreak(completionKeys: string[], now: Date): number {
  const days = sortedUniqueDays(completionKeys)
  if (days.length === 0) return 0

  const today = startOfDay(now)
  const last = days[days.length - 1]
  if (last > today) return 0

  const usedByMonth = new Map<string, number>()
  if (!bridgeable(last, today, usedByMonth)) return 0

  let start = last
  for (let i = days.length - 2; i >= 0; i--) {
    if (bridgeable(days[i], days[i + 1], usedByMonth)) {
      start = days[i]
    } else {
      break
    }
  }
  return daysBetween(start, last) + 1
}