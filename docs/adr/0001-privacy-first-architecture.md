# ADR 0001: Privacy-First Architecture with Recovery Key Identity

## Status

Accepted

## Context

We are building a gamified life tracker for privacy-conscious individuals. The core tension is: how do we provide sync, recovery, and a good UX without compromising privacy?

Traditional approaches:
- **Account-based** (email/password): Requires PII, creates attack surface, server can read data
- **OAuth** (Google/Apple login): Third-party dependency, tracking, privacy leak
- **Local-only** (no sync): Maximum privacy, but data loss on device failure, no cross-device

## Decision

We will use a **recovery key identity** with **encrypted blob sync**:

1. **No accounts**: No email, phone, or PII required to use the app
2. **Recovery key**: 12-24 word mnemonic phrase serves as identity and enables cross-device recovery
3. **Local-first storage**: All data stored in IndexedDB, encrypted with AES-256-GCM
4. **Encrypted blob sync**: Server stores opaque encrypted blobs; zero knowledge of contents
5. **Open source**: Full code available for verification

## Consequences

### Positive
- **True privacy**: Server cannot read user data even if compromised
- **No attack surface**: No email/password database to breach
- **User ownership**: Users literally hold their identity (the key)
- **Verifiable**: Open source lets privacy-conscious users verify claims
- **Cross-device**: Recovery key enables sync without accounts

### Negative
- **Key management burden**: Users must save their recovery key or lose data
- **No social features**: Cannot implement leaderboards, parties, or social accountability (by design)
- **Onboarding friction**: Must explain and enforce key save before first use
- **Recovery complexity**: Lost key = lost data (no "forgot password" flow)

### Mitigations
- **Onboarding emphasis**: Force key understanding and save before any tracking begins
- **Clear UX**: Show key importance prominently, not in fine print
- **Export always available**: Users can export data at any time as backup
- **Progressive sync**: Start local-only, add sync when data model is proven

## Alternatives Considered

1. **Zero-knowledge proofs**: Would allow proving activity without revealing data. Too complex for v1; revisit for social features.

2. **Decentralized identity (DID)**: Would give users portable identity. Adds complexity; recovery key is simpler and proven (crypto wallets).

3. **Biometric + device key**: Better UX (fingerprint to unlock). Tied to hardware, complicates recovery. Consider for v2 mobile apps.

4. **Self-hosted sync server**: Maximum control for users. Higher barrier; encrypted blob store is simpler for v1.
