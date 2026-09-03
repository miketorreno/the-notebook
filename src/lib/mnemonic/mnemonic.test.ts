import { describe, expect, it } from 'vitest'
import {
  generateMnemonic,
  validateMnemonic,
  normalizeMnemonic,
} from './mnemonic'

describe('mnemonic', () => {
  describe('generateMnemonic', () => {
    it('generates a 12-word mnemonic by default', () => {
      const phrase = generateMnemonic()
      const words = phrase.split(' ')
      expect(words).toHaveLength(12)
    })

    it('generates a 24-word mnemonic when requested', () => {
      const phrase = generateMnemonic(24)
      const words = phrase.split(' ')
      expect(words).toHaveLength(24)
    })

    it('produces a different mnemonic on each call', () => {
      const a = generateMnemonic()
      const b = generateMnemonic()
      expect(a).not.toBe(b)
    })

    it('all words are lowercase alphabetic', () => {
      const phrase = generateMnemonic()
      for (const word of phrase.split(' ')) {
        expect(word).toMatch(/^[a-z]+$/)
      }
    })
  })

  describe('validateMnemonic', () => {
    it('returns true for a valid 12-word mnemonic', () => {
      const phrase = generateMnemonic()
      expect(validateMnemonic(phrase)).toBe(true)
    })

    it('returns true for a valid 24-word mnemonic', () => {
      const phrase = generateMnemonic(24)
      expect(validateMnemonic(phrase)).toBe(true)
    })

    it('returns false for a phrase with wrong word count', () => {
      expect(validateMnemonic('one two three')).toBe(false)
    })

    it('returns false for a phrase containing unknown words', () => {
      // Build a 12-word phrase with one invalid word
      const valid = generateMnemonic().split(' ')
      valid[5] = 'zzzzzzzzzzz'
      expect(validateMnemonic(valid.join(' '))).toBe(false)
    })

    it('returns false for an empty string', () => {
      expect(validateMnemonic('')).toBe(false)
    })
  })

  describe('normalizeMnemonic', () => {
    it('trims and lowercases the phrase', () => {
      const phrase = generateMnemonic()
      const upper = phrase.toUpperCase()
      expect(normalizeMnemonic(`  ${upper}  `)).toBe(phrase)
    })

    it('collapses multiple spaces', () => {
      const phrase = generateMnemonic()
      const spaced = phrase.split(' ').join('   ')
      expect(normalizeMnemonic(spaced)).toBe(phrase)
    })
  })
})
