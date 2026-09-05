import { describe, expect, it } from 'vitest'
import { dayKeyOf, windowStartOf, currentStreak, graceDaysUsedInWindow } from './grace'

describe('dayKeyOf', () => {
  it('returns YYYY-MM-DD with zero padding', () => {
    expect(dayKeyOf(new Date(2025, 0, 5))).toBe('2025-01-05')
    expect(dayKeyOf(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

describe('windowStartOf', () => {
  it('returns the first day of the calendar month', () => {
    expect(windowStartOf(new Date(2025, 11, 15))).toEqual(new Date(2025, 11, 1))
    expect(windowStartOf(new Date(2025, 0, 5))).toEqual(new Date(2025, 0, 1))
  })
})

describe('graceDaysUsedInWindow', () => {
  const janStart = new Date(2025, 0, 1)

  it('uses 0 grace days with no gaps', () => {
    const completions = ['2025-01-01', '2025-01-02', '2025-01-03']
    expect(graceDaysUsedInWindow(completions, janStart, new Date(2025, 0, 3))).toBe(0)
  })

  it('uses 1 grace day for a single gap', () => {
    const completions = ['2025-01-01', '2025-01-03']
    expect(graceDaysUsedInWindow(completions, janStart, new Date(2025, 0, 3))).toBe(1)
  })

  it('counts every missed day in the month through now', () => {
    const completions = ['2025-01-01']
    expect(graceDaysUsedInWindow(completions, janStart, new Date(2025, 0, 5))).toBe(4)
  })

  it('ignores completions outside the window', () => {
    const completions = ['2024-12-28', '2025-01-01']
    expect(graceDaysUsedInWindow(completions, janStart, new Date(2025, 0, 1))).toBe(0)
  })
})

describe('currentStreak', () => {
  it('returns 0 with no completions', () => {
    expect(currentStreak([], new Date(2025, 0, 10))).toBe(0)
  })

  it('counts a single completion today', () => {
    expect(currentStreak(['2025-01-10'], new Date(2025, 0, 10))).toBe(1)
  })

  it('counts consecutive days', () => {
    const completions = ['2025-01-08', '2025-01-09', '2025-01-10']
    expect(currentStreak(completions, new Date(2025, 0, 10))).toBe(3)
  })

  it('uses grace to bridge a one-day gap', () => {
    expect(currentStreak(['2025-01-08', '2025-01-10'], new Date(2025, 0, 10))).toBe(3)
  })

  it('uses both grace days across separate gaps', () => {
    const completions = ['2025-01-06', '2025-01-08', '2025-01-10']
    expect(currentStreak(completions, new Date(2025, 0, 10))).toBe(5)
  })

  it('breaks when a gap exceeds the monthly grace limit', () => {
    const completions = ['2025-01-06', '2025-01-10']
    expect(currentStreak(completions, new Date(2025, 0, 10))).toBe(1)
  })

  it('stays alive on a missed day but counts only completed days', () => {
    expect(currentStreak(['2025-01-09'], new Date(2025, 0, 10))).toBe(1)
    expect(currentStreak(['2025-01-10'], new Date(2025, 0, 10))).toBe(1)
  })

  it('does not inflate while idle and returns 0 once grace runs out', () => {
    expect(currentStreak(['2025-01-09'], new Date(2025, 0, 11))).toBe(1)
    expect(currentStreak(['2025-01-09'], new Date(2025, 0, 12))).toBe(1)
    expect(currentStreak(['2025-01-09'], new Date(2025, 0, 13))).toBe(0)
  })

  it('returns 0 when the streak broke well before today', () => {
    expect(currentStreak(['2025-01-01'], new Date(2025, 0, 5))).toBe(0)
  })

  it('bridges across a month boundary within grace', () => {
    const completions = ['2024-12-31', '2025-01-02']
    expect(currentStreak(completions, new Date(2025, 0, 2))).toBe(3)
  })

  it('breaks when the month boundary gap exceeds grace', () => {
    const completions = ['2024-12-10', '2025-01-02']
    expect(currentStreak(completions, new Date(2025, 0, 2))).toBe(1)
  })
})