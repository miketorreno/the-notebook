# 06: Grace periods + secondary streak

**What to build:** Grace periods (2 days per 30-day window, resetting monthly) and a secondary streak counter that uses grace. The primary metric remains cumulative completions (never decreasing); streaks are shown as secondary info without anxiety.

**Blocked by:** 05

**Status:** done

- [x] 2 grace days per 30-day window, resetting monthly
- [x] Secondary streak counter uses grace days
- [x] Cumulative completions are unaffected by missed days
- [x] Missing a day does not feel punitive in the UI

## Comments

Closed by commit implementing the grace module, the streak derivation, the
persisted completion-day history, and the current-streak panel metric.