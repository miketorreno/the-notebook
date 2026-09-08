# 04: Activity logging (3 domains)

**What to build:** Log Health/Learning/Productivity activities with one-tap quick log, difficulty (Easy/Medium/Hard), optional notes, and per-activity XP calculation. Includes an activity history view for reflection. Custom activity types within the three domains.

**Blocked by:** 02

**Status:** done

- [x] Log an activity in any of the three domains with one tap
- [x] Difficulty (Easy/Medium/Hard) affects XP earned
- [x] Optional notes can be attached to an activity
- [x] Activity history viewable
- [x] Custom activity types can be created within the three domains

## Comments

Implemented in commit `8df25a9`. Added an `activity` domain module (`calculateXp` Easy=10/Medium=25/Hard=50, `buildActivity`, `DEFAULT_ACTIVITY_TYPES`), an encrypted `ActivityStore` backed by the IndexedDB store (activities + custom types encrypted at rest; custom types domain-scoped), a `list` primitive on the encrypted store, and an `ActivityLog` component with one-tap quick log, difficulty + notes controls, custom-type creation, and a history view.

Note: the "history viewable" item is via the `listActivities` seam (newest-first) and the history panel in `ActivityLog`. A wrong recovery key on the reload unlock flow is verified by attempting a decrypt before entering the vault. Issues #05 (XP/leveling/cumulative) will consume the per-activity XP stored here; archetype-scaled XP is deferred to that slice.
