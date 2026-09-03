export interface EncryptedRecord {
  /** Initialization vector used for AES-256-GCM. */
  iv: ArrayBuffer
  /** The AES-256-GCM authenticated ciphertext (includes the auth tag). */
  ciphertext: ArrayBuffer
}

/** Any JSON-serializable value that can be encrypted at rest. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

/** Byte length of the random salt generated for PBKDF2 key derivation. */
export const SALT_BYTES = 16

/** Default PBKDF2 work factor for key derivation. */
export const PBKDF2_ITERATIONS = 600_000

/**
 * Generate a fresh random salt for a user's stored data. Persisted in the
 * clear alongside the encrypted records — it is not secret. A unique salt
 * per user/device prevents precomputed attacks on the recovery phrase.
 */
export function generateSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES))
}

/**
 * Derive a deterministic AES-256-GCM key from a recovery phrase and salt.
 * The same phrase + salt always yields the same key, enabling offline recovery.
 */
export async function deriveKey(
  recoveryPhrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(recoveryPhrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  )
}

function encode(value: JsonValue): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

function decode(bytes: BufferSource): JsonValue {
  return JSON.parse(new TextDecoder().decode(bytes))
}

/**
 * Encrypt a JSON-serializable value into an opaque record.
 * The record holds a fresh random IV and the ciphertext — never the plaintext.
 */
export async function encryptRecord(
  key: CryptoKey,
  value: JsonValue,
): Promise<EncryptedRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encode(value),
  )
  return { iv: iv.buffer, ciphertext }
}

/**
 * Decrypt an opaque record back into its original JSON value.
 * Throws if the ciphertext has been tampered with or the key is wrong.
 */
export async function decryptRecord(
  key: CryptoKey,
  record: EncryptedRecord,
): Promise<JsonValue> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: record.iv },
    key,
    record.ciphertext,
  )
  return decode(plaintext)
}
