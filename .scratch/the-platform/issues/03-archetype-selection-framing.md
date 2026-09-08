# 03: Archetype selection + framing

**What to build:** Choice of archetype (Warrior, Sage, Builder, Explorer, Monk) during onboarding and the per-archetype narrative framing so the app presents habits through that lens (e.g. Warrior sees Health as "training", Sage sees Learning as "study"). Start with 2-3 archetypes. Includes the ability to change archetype later with narrative justification.

**Blocked by:** 02

**Status:** done

- [x] User chooses an archetype during onboarding with descriptions of each
- [x] Archetype framing changes how quests/activities are described
- [x] At least 2 archetypes implemented
- [x] Archetype can be changed later (with narrative justification)

## Comments

Implemented in commit `d75261e`. Added an `archetype` domain module (Warrior, Sage, Builder — 3 archetypes) with `frameDomain` framing, a localStorage-backed store (archetype + change justification), an onboarding archetype step, and a "change archetype" flow that requires a narrative justification.

Note: the "Archetype framing changes how quests/activities are described" item is satisfied via the `frameDomain` seam and framing display on the dashboard; quests do not exist yet (#07) and will consume the framing when built.
