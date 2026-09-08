import { describe, expect, it } from 'vitest'
import { secureEqual } from './secure-compare'

describe('secureEqual', () => {
  it('returns true when strings are identical', async () => {
    await expect(secureEqual('hello world', 'hello world')).resolves.toBe(true)
  })

  it('returns false when strings differ', async () => {
    await expect(secureEqual('hello world', 'hello worle')).resolves.toBe(false)
    await expect(secureEqual('hello', 'helloo')).resolves.toBe(false)
  })

  it('returns false when strings differ in length', async () => {
    await expect(secureEqual('a b c', 'a b c d')).resolves.toBe(false)
  })

  it('returns true for identical multi-word mnemonics', async () => {
    const phrase =
      'abandon ability able about above absent absorb abstract absurd abuse access accident'
    await expect(secureEqual(phrase, phrase)).resolves.toBe(true)
  })

  it('returns false when one character is different in a long string', async () => {
    const a = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const b = a.slice(0, -1) + (a.endsWith('t') ? 'x' : 't')
    await expect(secureEqual(a, b)).resolves.toBe(false)
  })
})
