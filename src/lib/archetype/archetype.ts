export const DOMAINS = ['Health', 'Learning', 'Productivity'] as const
export type Domain = (typeof DOMAINS)[number]

export type ArchetypeId = 'warrior' | 'sage' | 'builder'

export interface Archetype {
  id: ArchetypeId
  name: string
  tagline: string
  description: string
  framing: Record<Domain, string>
}

export const ALL_ARCHETYPES: Archetype[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    tagline: 'Discipline through training',
    description:
      'You treat your health as training. Every workout, rest, and meal is a rep in your campaign to become stronger. Momentum comes from conditioning, not luck.',
    framing: {
      Health: 'training',
      Learning: 'tactics',
      Productivity: 'campaign',
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    tagline: 'Wisdom through study',
    description:
      'You treat your growth as study. Every book, course, and experiment is a lesson. You collect understanding the way others collect trophies.',
    framing: {
      Health: 'care',
      Learning: 'study',
      Productivity: 'craft',
    },
  },
  {
    id: 'builder',
    name: 'Builder',
    tagline: 'Progress through crafting',
    description:
      'You treat your output as crafting. Every task, habit, and routine is work you shape into something lasting. You build your life the way you build anything: piece by piece.',
    framing: {
      Health: 'maintenance',
      Learning: 'blueprints',
      Productivity: 'crafting',
    },
  },
]

/** Return the archetype with the given id, or undefined if unknown. */
export function getArchetype(id: string): Archetype | undefined {
  return ALL_ARCHETYPES.find((a) => a.id === id)
}

/**
 * Frame a domain through an archetype's lens, returning the thematic term
 * used to describe that kind of activity (e.g. Warrior frames Health as
 * "training"). Throws if the archetype or domain is unknown.
 */
export function frameDomain(id: ArchetypeId, domain: Domain): string {
  const archetype = getArchetype(id)
  if (!archetype) {
    throw new Error(`Unknown archetype: ${id}`)
  }
  const term = archetype.framing[domain]
  if (!term) {
    throw new Error(`No framing for ${domain} under ${id}`)
  }
  return term
}
