/**
 * Constant-time string equality using SHA-256 digests.
 * Each input is hashed independently, then the two digests are compared with a
 * bitwise XOR that never short-circuits, so the comparison time does not leak
 * how many leading characters matched.
 */
export async function secureEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const A = new Uint8Array(da)
  const B = new Uint8Array(db)
  let diff = 0
  for (let i = 0; i < A.length; i++) {
    diff |= A[i] ^ B[i]
  }
  return diff === 0
}
