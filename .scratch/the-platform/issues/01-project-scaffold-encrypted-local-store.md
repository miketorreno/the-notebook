# 01: Project scaffold + encrypted local store

**What to build:** A working PWA skeleton (Svelte + Vite + Skeleton UI) with an encrypted IndexedDB storage layer (AES-256-GCM) underneath, exposing the storage/retrieval primitive that every later slice builds on. The app installs, runs offline, and can save/load encrypted records locally — verified without needing any specific user-facing feature yet.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] PWA installs and runs offline (service worker + manifest)
- [ ] Encrypted IndexedDB store persists and retrieves a record round-trip
- [ ] Data is stored encrypted (AES-256-GCM) at rest
- [ ] Abstract/symbolic visual base + dark mode support in place
