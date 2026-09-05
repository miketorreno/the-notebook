# 08: Cross-domain "Well-Rounded" bonus

**What to build:** A bonus (1.5x XP for the week) and achievement triggered when all three domains are tracked within a 7-day window, plus a visual badge/icon on the dashboard. Incentivizes balanced life tracking across domains.

**Blocked by:** 07

**Status:** done

- [x] Well-Rounded achievement triggers on tracking all three domains within 7 days
- [x] 1.5x XP multiplier applied for the week
- [x] Visual badge/icon appears on dashboard

## Comments

Closed by the commit implementing the well-rounded module (trailing 7-day
window detection over the three domains, the `WELL_ROUNDED_XP_MULTIPLIER`
1.5x applied to activity XP through an optional multiplier on the progression
store's `recordActivity`), the encrypted well-rounded achievement store that
persists the first unlock, and the dashboard badge shown on the progression
panel while the bonus is active.