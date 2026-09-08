import { describe, expect, it, beforeEach } from 'vitest'
import {
  setArchetype,
  getCurrentArchetype,
  hasArchetype,
  clearArchetype,
  recordArchetypeChange,
  getArchetypeJustification,
} from './archetype-store'

describe('archetype persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('setArchetype / getCurrentArchetype', () => {
    it('persists and retrieves a chosen archetype', () => {
      setArchetype('warrior')
      expect(getCurrentArchetype()?.id).toBe('warrior')
    })

    it('overwrites a previously chosen archetype', () => {
      setArchetype('warrior')
      setArchetype('sage')
      expect(getCurrentArchetype()?.id).toBe('sage')
    })

    it('returns the full archetype (name and framing) for the stored id', () => {
      setArchetype('sage')
      const current = getCurrentArchetype()
      expect(current?.name).toBe('Sage')
      expect(current?.framing.Learning).toBe('study')
    })

    it('returns null when no archetype is set', () => {
      expect(getCurrentArchetype()).toBeNull()
    })
  })

  describe('hasArchetype', () => {
    it('returns false when no archetype is set', () => {
      expect(hasArchetype()).toBe(false)
    })

    it('returns true after an archetype is chosen', () => {
      setArchetype('builder')
      expect(hasArchetype()).toBe(true)
    })
  })

  describe('clearArchetype', () => {
    it('removes the stored archetype', () => {
      setArchetype('warrior')
      clearArchetype()
      expect(hasArchetype()).toBe(false)
      expect(getCurrentArchetype()).toBeNull()
    })

    it('also clears the recorded justification', () => {
      recordArchetypeChange('sage', 'my study deepened')
      clearArchetype()
      expect(getArchetypeJustification()).toBe('')
    })
  })

  describe('recordArchetypeChange', () => {
    it('sets the archetype and stores the justification', () => {
      recordArchetypeChange('builder', 'I want to craft more')
      expect(getCurrentArchetype()?.id).toBe('builder')
      expect(getArchetypeJustification()).toBe('I want to craft more')
    })

    it('trims surrounding whitespace from the justification', () => {
      recordArchetypeChange('sage', '  reasons  ')
      expect(getArchetypeJustification()).toBe('reasons')
    })
  })

  describe('getArchetypeJustification', () => {
    it('returns an empty string when nothing is recorded', () => {
      expect(getArchetypeJustification()).toBe('')
    })
  })
})
