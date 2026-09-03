# The Platform

A privacy-first, gamified life tracker that turns daily actions into an RPG adventure.

- **Local-first**: all data stored in IndexedDB, encrypted with AES-256-GCM
- **No accounts**: identity is a recovery key (mnemonic phrase) generated client-side
- **E2E encrypted sync** (v1): the server stores opaque encrypted blobs, zero knowledge of contents
- **Open source**: the full codebase is available for verification

## Tech Stack

- **Svelte 5** + **Vite** + **TypeScript**
- **Skeleton UI** + **Tailwind CSS v4** for the design system
- **PWA** via `vite-plugin-pwa` (service worker + manifest)
- **Vitest** for testing

## Scripts

| Script            | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start the Vite dev server               |
| `npm run build`   | Build the production bundle (incl. PWA) |
| `npm run preview` | Preview the production build            |
| `npm run test`    | Run the test suite                      |
| `npm run check`   | Run svelte-check + tsc typechecking     |

## Current State

Issue #01: PWA scaffold + encrypted local store.

- PWA installs and runs offline (service worker + manifest)
- Encrypted IndexedDB store persists/retrieves records round-trip
- Data stored encrypted (AES-256-GCM) at rest, keyed off a recovery phrase
- Abstract/symbolic visual base with dark mode support

See the issue tracker under `.scratch/the-platform/` for the full roadmap.
