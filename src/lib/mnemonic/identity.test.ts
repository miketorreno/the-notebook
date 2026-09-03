import { describe, expect, it, beforeEach } from 'vitest'
import {
  saveRecoverySalt,
  loadRecoverySalt,
  clearRecoveryState,
  needsOnboarding,
} from './identity'

describe('identity persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveRecoverySalt / loadRecoverySalt', () => {
    it('round-trips a salt through localStorage', () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      saveRecoverySalt(salt)
      const loaded = loadRecoverySalt()
      expect(loaded).toEqual(salt)
    })

    it('returns null when no salt is saved', () => {
      expect(loadRecoverySalt()).toBeNull()
    })

    it('overwrites a previously saved salt', () => {
      const first = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      const second = new Uint8Array([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
      saveRecoverySalt(first)
      saveRecoverySalt(second)
      expect(loadRecoverySalt()).toEqual(second)
    })
  })

  describe('clearRecoveryState', () => {
    it('removes the saved salt', () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      saveRecoverySalt(salt)
      clearRecoveryState()
      expect(loadRecoverySalt()).toBeNull()
    })
  })

  describe('needsOnboarding', () => {
    it('returns true when no salt is saved', () => {
      expect(needsOnboarding()).toBe(true)
    })

    it('returns false when a salt is saved', () => {
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      saveRecoverySalt(salt)
      expect(needsOnboarding()).toBe(false)
    })
  })
})
