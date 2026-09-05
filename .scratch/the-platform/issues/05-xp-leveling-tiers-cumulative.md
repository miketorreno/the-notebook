# 05: XP, leveling, tiers, cumulative completions

**What to build:** The progression system: exponential XP curve (100*(level^1.5)), level-up events, tier milestones (Bronze at 10, Silver at 25, Gold at 50, Platinum at 100), and the cumulative completions count as the primary progress metric. Dashboard shows current XP, level, tier, and cumulative completions at all times.

**Blocked by:** 04

**Status:** done

- [x] XP accumulates per the exponential curve formula
- [x] Level-up happens when XP threshold is reached
- [x] Tier milestones (Bronze/Silver/Gold/Platinum) recognized
- [x] Cumulative completions count tracked and never decreases
- [x] Dashboard shows XP, level, tier, and cumulative completions

## Comments

Implemented in the commit closing this issue. Added a `progression` domain module: pure curve/level/tier functions (`xpForLevel` = `round(100 * level^1.5)`, cumulative thresholds, `tierFromLevel` Bronze 10 / Silver 25 / Gold 50 / Platinum 100, `buildProgression` snapshot) and an encrypted `ProgressionStore` that keeps a single monotonic `progression` record in the same IndexedDB vault as the activities (total XP + cumulative completions; level/tier derived from total XP). Every logged activity goes through `recordActivity`, which persists the record and returns a level-up event; the log panel is wired to it as the completion seam. The record is backfilled once from pre-existing activities so returning users pick up where they left off; cumulative completions never decrease because they are a stored counter, not the length of a deletable list. The dashboard (`ProgressionPanel`) shows level, current/new-level XP with a progress bar, tier, total XP, and cumulative completions at all times, and flashes a level-up notice when a log crosses a threshold. The encrypted store engine now auto-creates missing object stores by bumping the schema version, so the new collection coexists with the activity store regardless of open order.
