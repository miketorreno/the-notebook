# 07: Quest system (templates + chains)

**What to build:** System-generated quests from templates with variable slots ({count}, {activity}, {domain}, {enemy}, {archetype}), quest chains (3-7 steps, each unlocking the next), progress bars, clear win states, and three-star grading (baseline + elevated + maximum). Quest completion awards XP. Quests frame the user as protagonist.

**Blocked by:** 04

**Status:** done

- [x] System quests generated from templates using variable slots
- [x] Quests chain (completing one unlocks the next), 3-7 steps
- [x] Progress bars show how close a quest is to completion
- [x] Crystal-clear win state for each quest
- [x] Three-star grading: baseline + elevated + maximum
- [x] Completing a quest awards XP
- [x] Quest text uses archetype framing

## Comments

Closed by the commit implementing the quest module (template catalog with
{count}/{activity}/{domain}/{enemy}/{archetype} slots, escalating 3-7 step
chains, three-star grading, stretch-goal upgrades, and quest XP channeled
through the progression store), the encrypted quest chain store, and the
quest saga panel on the dashboard.
