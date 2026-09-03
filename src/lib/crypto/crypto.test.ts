import { describe, expect, it } from 'vitest'
import {
  decryptRecord,
  deriveKey,
  encryptRecord,
  generateSalt,
  type EncryptedRecord,
  type JsonValue,
} from './crypto'

describe('crypto', () => {
  describe('generateSalt', () => {
    it('produces a salt of the expected byte length', () => {
      const salt = generateSalt()
      expect(salt.byteLength).toBe(16)
    })

    it('produces a different salt on each call', () => {
      expect(generateSalt()).not.toEqual(generateSalt())
    })
  })

  describe('deriveKey', () => {
    const salt = generateSalt()

    it('derives the same key from the same recovery phrase and salt', async () => {
      const a = await deriveKey('word word word', salt)
      const b = await deriveKey('word word word', salt)
      expect(a).toBeInstanceOf(CryptoKey)
      expect(b).toBeInstanceOf(CryptoKey)
      // Two derivations must produce an identical key (exported bytes match).
      const aRaw = await crypto.subtle.exportKey('raw', a)
      const bRaw = await crypto.subtle.exportKey('raw', b)
      expect(new Uint8Array(aRaw)).toEqual(new Uint8Array(bRaw))
    })

    it('derives a different key for a different recovery phrase', async () => {
      const a = await deriveKey('first phrase', salt)
      const b = await deriveKey('second phrase', salt)
      const aRaw = new Uint8Array(await crypto.subtle.exportKey('raw', a))
      const bRaw = new Uint8Array(await crypto.subtle.exportKey('raw', b))
      expect(aRaw).not.toEqual(bRaw)
    })

    it('derives a different key for a different salt', async () => {
      // Different salt, same phrase — must yield a different key.
      const a = await deriveKey('same phrase', generateSalt())
      const b = await deriveKey('same phrase', generateSalt())
      const aRaw = new Uint8Array(await crypto.subtle.exportKey('raw', a))
      const bRaw = new Uint8Array(await crypto.subtle.exportKey('raw', b))
      expect(aRaw).not.toEqual(bRaw)
    })

    it('yields exactly 32 bytes for AES-256', async () => {
      const key = await deriveKey('some recovery phrase here', salt)
      const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
      expect(raw.byteLength).toBe(32)
    })
  })

  describe('encryptRecord / decryptRecord', () => {
    const keyPromise = deriveKey('same key phrase', generateSalt())

    it('round-trips a JSON value encrypted with the same key', async () => {
      const key = await keyPromise
      const value: JsonValue = { domain: 'Health', count: 3, nested: { ok: true } }
      const encrypted: EncryptedRecord = await encryptRecord(key, value)
      const decrypted = await decryptRecord(key, encrypted)
      expect(decrypted).toEqual(value)
    })

    it('produces ciphertext that differs from the plaintext', async () => {
      const key = await keyPromise
      const plaintext: JsonValue = { message: 'secret habit data' }
      const encrypted = await encryptRecord(key, plaintext)
      const cipherBytes = new Uint8Array(encrypted.ciphertext)
      // Serialized JSON would be non-zero length; ensure the bytes are not the literal UTF-8 of the plaintext.
      const plainBytes = new TextEncoder().encode(JSON.stringify(plaintext))
      expect(cipherBytes).not.toEqual(plainBytes)
    })

    it('uses a fresh random IV for each encryption', async () => {
      const key = await keyPromise
      const first = await encryptRecord(key, { v: 1 })
      const second = await encryptRecord(key, { v: 1 })
      expect(new Uint8Array(first.iv)).not.toEqual(new Uint8Array(second.iv))
    })

    it('fails to decrypt with the wrong key', async () => {
      const rightKey = await deriveKey('right key', generateSalt())
      const wrongKey = await deriveKey('wrong key', generateSalt())
      const encrypted = await encryptRecord(rightKey, { secret: true })
      await expect(decryptRecord(wrongKey, encrypted)).rejects.toThrow()
    })

    it('exposes a non-empty, non-secret IV and ciphertext on the record', async () => {
      const key = await keyPromise
      const encrypted = await encryptRecord(key, { hello: 'world' })
      expect(encrypted.iv.byteLength).toBeGreaterThan(0)
      expect(encrypted.ciphertext.byteLength).toBeGreaterThan(0)
    })
  })
})
