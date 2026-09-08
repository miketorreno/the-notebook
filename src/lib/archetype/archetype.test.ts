import { describe, expect, it } from 'vitest'
import {
  ALL_ARCHETYPES,
  DOMAINS,
  getArchetype,
  frameDomain,
  type ArchetypeId,
  type Domain,
} from './archetype'

describe('archetype definitions', () => {
  it('exposes at least two archetypes', () => {
    expect(ALL_ARCHETYPES.length).toBeGreaterThanOrEqual(2)
  })

  it('exposes Warrior, Sage, and Builder', () => {
    const ids = ALL_ARCHETYPES.map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['warrior', 'sage', 'builder']))
  })

  it('every archetype has an id, name, tagline, description, and framing for every domain', () => {
    for (const a of ALL_ARCHETYPES) {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.tagline).toBeTruthy()
      expect(a.description).toBeTruthy()
      for (const domain of DOMAINS) {
        expect(a.framing[domain]).toBeTruthy()
      }
    }
  })

  it('framing terms match the documented archetypal lens', () => {
    expect(frameDomain('warrior', 'Health')).toBe('training')
    expect(frameDomain('sage', 'Learning')).toBe('study')
  })
})

describe('getArchetype', () => {
  it('returns the archetype for a known id', () => {
    const warrior = getArchetype('warrior')
    expect(warrior?.name).toBe('Warrior')
  })

  it('returns the archetype for Warrior, Sage, and Builder', () => {
    expect(getArchetype('warrior')).toBeDefined()
    expect(getArchetype('sage')).toBeDefined()
    expect(getArchetype('builder')).toBeDefined()
  })

  it('returns undefined for an unknown id', () => {
    expect(getArchetype('wizard')).toBeUndefined()
  })
})

describe('frameDomain', () => {
  it('returns the framing term for a given archetype and domain', () => {
    const warrior = getArchetype('warrior')
    expect(frameDomain('warrior', 'Learning')).toBe(warrior?.framing.Learning)
  })

  it('provides a distinct framing term for each domain on Warrior', () => {
    const terms = DOMAINS.map((d) => frameDomain('warrior', d))
    expect(new Set(terms).size).toBe(DOMAINS.length)
  })

  it('throws for an unknown archetype or domain', () => {
    expect(() => frameDomain('wizard' as ArchetypeId, 'Health')).toThrow()
    expect(() => frameDomain('warrior', 'Unknown' as Domain)).toThrow()
  })
})
