import { WORD_LIST } from './words'

const WORD_SET = new Set(WORD_LIST)

/**
 * Generate a BIP-39 compatible mnemonic phrase from cryptographic randomness.
 *
 * @param wordCount 12 (default, 128-bit entropy) or 24 (256-bit entropy).
 * @returns A space-separated mnemonic phrase.
 */
export function generateMnemonic(wordCount: 12 | 24 = 12): string {
  const entropyBits = wordCount === 12 ? 128 : 256
  const entropyBytes = entropyBits / 8
  const entropy = crypto.getRandomValues(new Uint8Array(entropyBytes))
  return entropyToMnemonic(entropy)
}

/**
 * Validate a mnemonic phrase: correct word count, all words in BIP-39 list,
 * and checksum matches.
 */
export function validateMnemonic(phrase: string): boolean {
  const words = normalizeMnemonic(phrase).split(' ')
  if (words.length !== 12 && words.length !== 24) return false
  if (!words.every((w) => WORD_SET.has(w))) return false

  const bits = wordsToBits(words)
  const entropyBits = words.length === 12 ? 128 : 256
  const checksumBits = bits.length - entropyBits

  const entropyBytes = bitsToBytes(bits.slice(0, entropyBits))
  const expectedChecksum = computeChecksum(entropyBytes, checksumBits)
  const actualChecksum = bits.slice(entropyBits)

  return bitsEqual(expectedChecksum, actualChecksum)
}

/**
 * Normalize a mnemonic phrase: trim, lowercase, collapse whitespace.
 */
export function normalizeMnemonic(phrase: string): string {
  return phrase.trim().toLowerCase().split(/\s+/).join(' ')
}

// ─── Internal helpers ───────────────────────────────────────────────

function entropyToMnemonic(entropy: Uint8Array): string {
  const entropyBits = bytesToBits(entropy)
  const checksumBits = entropyBits.length / 32 // SHA-256 first byte → 8 bits
  const checksum = computeChecksum(entropy, checksumBits)
  const allBits = [...entropyBits, ...checksum]

  const words: string[] = []
  for (let i = 0; i < allBits.length; i += 11) {
    const index = bitsToNumber(allBits.slice(i, i + 11))
    words.push(WORD_LIST[index])
  }
  return words.join(' ')
}

function computeChecksum(entropy: Uint8Array, checksumBits: number): number[] {
  const hash = sha256Sync(entropy)
  const bits: number[] = []
  for (let i = 0; i < checksumBits; i++) {
    const byteIdx = i >> 3
    const bitIdx = 7 - (i & 7)
    bits.push((hash[byteIdx] >> bitIdx) & 1)
  }
  return bits
}

// Minimal sync SHA-256 for BIP-39 checksum computation.
// This is a well-known algorithm; we only need it for the checksum byte.
function sha256Sync(message: Uint8Array): number[] {
  // Pre-processing
  const msg = new Uint8Array(message.length + 1)
  msg.set(message)
  msg[message.length] = 0x80

  const bitLength = message.length * 8
  // We need the message to be ≡ 448 mod 512 bits before the 64-bit length
  const padLen = ((56 - (msg.length % 64)) + 64) % 64
  const padded = new Uint8Array(msg.length + padLen + 8)
  padded.set(msg)
  // Write bit length as big-endian 64-bit at the end
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength)
  view.setUint32(padded.length - 4, bitLength, false)

  // Initial hash values
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19

  for (let offset = 0; offset < padded.length; offset += 64) {
    const W = new Array(64)
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(offset + t * 4, false)
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0
    }

    let a = H0, b = H1, c = H2, d = H3
    let e = H4, f = H5, g = H6, h = H7

    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[t] + W[t]) | 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) | 0

      h = g; g = f; f = e; e = (d + temp1) | 0
      d = c; c = b; b = a; a = (temp1 + temp2) | 0
    }

    H0 = (H0 + a) | 0; H1 = (H1 + b) | 0; H2 = (H2 + c) | 0; H3 = (H3 + d) | 0
    H4 = (H4 + e) | 0; H5 = (H5 + f) | 0; H6 = (H6 + g) | 0; H7 = (H7 + h) | 0
  }

  return [
    (H0 >>> 24) & 0xff, (H0 >>> 16) & 0xff, (H0 >>> 8) & 0xff, H0 & 0xff,
    (H1 >>> 24) & 0xff, (H1 >>> 16) & 0xff, (H1 >>> 8) & 0xff, H1 & 0xff,
    (H2 >>> 24) & 0xff, (H2 >>> 16) & 0xff, (H2 >>> 8) & 0xff, H2 & 0xff,
    (H3 >>> 24) & 0xff, (H3 >>> 16) & 0xff, (H3 >>> 8) & 0xff, H3 & 0xff,
    (H4 >>> 24) & 0xff, (H4 >>> 16) & 0xff, (H4 >>> 8) & 0xff, H4 & 0xff,
    (H5 >>> 24) & 0xff, (H5 >>> 16) & 0xff, (H5 >>> 8) & 0xff, H5 & 0xff,
    (H6 >>> 24) & 0xff, (H6 >>> 16) & 0xff, (H6 >>> 8) & 0xff, H6 & 0xff,
    (H7 >>> 24) & 0xff, (H7 >>> 16) & 0xff, (H7 >>> 8) & 0xff, H7 & 0xff,
  ]
}

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0
}

function bytesToBits(bytes: Uint8Array): number[] {
  const bits: number[] = []
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1)
    }
  }
  return bits
}

function bitsToBytes(bits: number[]): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8))
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      bytes[i >> 3] |= 1 << (7 - (i & 7))
    }
  }
  return bytes
}

function bitsToNumber(bits: number[]): number {
  let n = 0
  for (const b of bits) {
    n = (n << 1) | b
  }
  return n
}

function wordsToBits(words: string[]): number[] {
  const bits: number[] = []
  for (const word of words) {
    const index = WORD_LIST.indexOf(word)
    // Convert index to 11-bit representation
    for (let i = 10; i >= 0; i--) {
      bits.push((index >> i) & 1)
    }
  }
  return bits
}

function bitsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
