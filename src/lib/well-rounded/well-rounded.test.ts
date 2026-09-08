import { describe, expect, it } from 'vitest'
import type { Domain } from '../archetype'
import {
  WELL_ROUNDED_WINDOW_DAYS,
  domainsTrackedInWindow,
  isWellRounded,
} from './well-rounded'

interface ActivitySlice {
  domain: Domain
  completedAt: string
}

function activityOn(domain: Domain, day: number, month = 0): ActivitySlice {
  return {
    domain,
    completedAt: new Date(2025, month, day, 12).toISOString(),
  }
}

describe('domainsTrackedInWindow', () => {
  it('returns no domains for an empty history', () => {
    expect(domainsTrackedInWindow([], new Date(2025, 0, 10))).toEqual([])
  })

  it('returns the unique domains seen within the window', () => {
    const activities = [
      activityOn('Health', 10),
      activityOn('Learning', 9),
      activityOn('Health', 8),
    ]
    expect(domainsTrackedInWindow(activities, new Date(2025, 0, 10))).toEqual([
      'Health',
      'Learning',
    ])
  })

  it('drops domains whose only activity falls outside the window', () => {
    const activities = [
      activityOn('Health', 10),
      activityOn('Learning', 2),
    ]
    expect(domainsTrackedInWindow(activities, new Date(2025, 0, 10))).toEqual([
      'Health',
    ])
  })

  it('counts an activity exactly on the window boundary', () => {
    const activities = [activityOn('Health', 4)]
    expect(domainsTrackedInWindow(activities, new Date(2025, 0, 10))).toEqual([
      'Health',
    ])
  })

  it('excludes an activity one day past the boundary', () => {
    const activities = [activityOn('Health', 3)]
    expect(domainsTrackedInWindow(activities, new Date(2025, 0, 10))).toEqual([])
  })
})

describe('isWellRounded', () => {
  it('is false when only some domains are tracked in the window', () => {
    const activities = [activityOn('Health', 10), activityOn('Learning', 9)]
    expect(isWellRounded(activities, new Date(2025, 0, 10))).toBe(false)
  })

  it('is true when all three domains are tracked within the window', () => {
    const activities = [
      activityOn('Health', 10),
      activityOn('Learning', 9),
      activityOn('Productivity', 8),
    ]
    expect(isWellRounded(activities, new Date(2025, 0, 10))).toBe(true)
  })

  it('is true even when one domain contributes a single activity', () => {
    const activities = [
      activityOn('Health', 10),
      activityOn('Health', 9),
      activityOn('Health', 8),
      activityOn('Learning', 10),
      activityOn('Productivity', 6),
    ]
    expect(isWellRounded(activities, new Date(2025, 0, 10))).toBe(true)
  })

  it('is false when a tracked domain falls out of the window', () => {
    const activities = [
      activityOn('Health', 10),
      activityOn('Learning', 9),
      activityOn('Productivity', 2),
    ]
    expect(isWellRounded(activities, new Date(2025, 0, 10))).toBe(false)
  })
})

describe('constants', () => {
  it('defines the window as seven calendar days', () => {
    expect(WELL_ROUNDED_WINDOW_DAYS).toBe(7)
  })
})