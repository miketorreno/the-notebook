import { DOMAINS, type Domain } from '../archetype'

/**
 * The trailing window (in calendar days) in which tracking all three domains
 * earns the "Well-Rounded" bonus.
 */
export const WELL_ROUNDED_WINDOW_DAYS = 7

/**
 * XP multiplier applied to activity XP while the Well-Rounded bonus is
 * active.
 */
export const WELL_ROUNDED_XP_MULTIPLIER = 1.5

/** The subset of an activity the window logic needs to evaluate. */
export interface TrackedActivity {
  domain: Domain
  completedAt: string
}

const MS_PER_DAY = 86_400_000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * The calendar-day cutoff that still counts as "within the last seven
 * days": the start of today minus six days, so an activity today and an
 * activity six days ago both count toward the same window.
 */
function windowStartOf(date: Date): Date {
  const start = startOfDay(date)
  return new Date(start.getTime() - (WELL_ROUNDED_WINDOW_DAYS - 1) * MS_PER_DAY)
}

/**
 * The domains tracked on activities within the trailing window, in the
 * canonical domain order. Activities at or after the window's start day
 * count; anything older is outside the window.
 */
export function domainsTrackedInWindow(
  activities: TrackedActivity[],
  now: Date,
): Domain[] {
  const cutoff = windowStartOf(now).getTime()
  const tracked = new Set(
    activities
      .filter((activity) => new Date(activity.completedAt).getTime() >= cutoff)
      .map((activity) => activity.domain),
  )
  return DOMAINS.filter((domain) => tracked.has(domain))
}

/**
 * Whether all three domains were tracked within the trailing window — the
 * trigger for the Well-Rounded bonus.
 */
export function isWellRounded(
  activities: TrackedActivity[],
  now: Date,
): boolean {
  return domainsTrackedInWindow(activities, now).length === DOMAINS.length
}