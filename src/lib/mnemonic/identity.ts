export const STORAGE_KEY = 'platform:recovery-salt'

/**
 * Save the recovery salt to localStorage.
 * The salt is not secret — it is stored in the clear alongside encrypted records.
 */
export function saveRecoverySalt(salt: Uint8Array): void {
  const hex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  localStorage.setItem(STORAGE_KEY, hex)
}

/**
 * Load the recovery salt from localStorage, or null if none is saved.
 */
export function loadRecoverySalt(): Uint8Array | null {
  const hex = localStorage.getItem(STORAGE_KEY)
  if (!hex) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Clear all recovery state from localStorage.
 */
export function clearRecoveryState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Returns true if the user has not yet completed onboarding
 * (no recovery salt saved).
 */
export function needsOnboarding(): boolean {
  return loadRecoverySalt() === null
}
