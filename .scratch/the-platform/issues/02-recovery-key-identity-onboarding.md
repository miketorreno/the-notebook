# 02: Recovery key identity + onboarding

**What to build:** The onboarding flow that generates a recovery key (mnemonic phrase), forces the user to confirm they have saved it before proceeding, and persists a derived key locally. This establishes the "no-account" identity foundation — no email, no phone, no PII anywhere.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Recovery key (12-24 word mnemonic) generated client-side
- [ ] User must confirm the key is saved before proceeding past onboarding
- [ ] Derived key persisted locally, never sent to a server
- [ ] Onboarding after key save takes under 60 seconds
