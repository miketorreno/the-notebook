import { getArchetype, type Archetype, type ArchetypeId } from './archetype'

export const STORAGE_KEY = 'platform:archetype'
export const JUSTIFICATION_STORAGE_KEY = 'platform:archetype-justification'

/**
 * Persist the user's chosen archetype id to localStorage (non-secret, like
 * the recovery salt). The archetype drives narrative framing; it is not
 * sensitive identity data.
 */
export function setArchetype(id: ArchetypeId): void {
  localStorage.setItem(STORAGE_KEY, id)
}

/**
 * Return the currently chosen archetype, or null if none has been saved.
 * A stored id that no longer matches a known archetype is treated as none.
 */
export function getCurrentArchetype(): Archetype | null {
  const id = localStorage.getItem(STORAGE_KEY)
  if (!id) return null
  return getArchetype(id) ?? null
}

/** True once the user has chosen an archetype. */
export function hasArchetype(): boolean {
  return getCurrentArchetype() !== null
}

/** Remove the stored archetype choice. */
export function clearArchetype(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(JUSTIFICATION_STORAGE_KEY)
}

/**
 * Change the current archetype and record the narrative justification for
 * the switch. The justification is the player's stated reason for leaving
 * their previous path; it is non-secret and stored locally.
 */
export function recordArchetypeChange(id: ArchetypeId, justification: string): void {
  localStorage.setItem(STORAGE_KEY, id)
  localStorage.setItem(JUSTIFICATION_STORAGE_KEY, justification.trim())
}

/** Return the justification recorded for the most recent archetype change. */
export function getArchetypeJustification(): string {
  return localStorage.getItem(JUSTIFICATION_STORAGE_KEY) ?? ''
}
