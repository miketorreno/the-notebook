# 13: E2E encrypted blob sync

**What to build:** A server acting as an encrypted blob store: the client pushes/pulls opaque encrypted blobs keyed by the recovery key. The server has zero knowledge of contents. Enables cross-device data access without accounts.

**Blocked by:** 11

**Status:** ready-for-agent

- [ ] Client syncs encrypted blobs to a server
- [ ] Server stores blobs with zero knowledge of contents
- [ ] Blobs are pushed/pulled keyed by the recovery key
- [ ] Data accessible across multiple devices
