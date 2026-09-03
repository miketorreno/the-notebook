# The Platform

A privacy-first, gamified life tracker that turns daily habits into an RPG adventure. Built on local-first architecture with E2E encryption, no accounts, and recovery key identity. Users track Health, Learning, and Productivity through archetype-driven quest chains, boss battles, and cumulative progression.

## Language

**Archetype**:
A character class that frames how the user experiences the tracker. Determines narrative tone, stat weighting, and quest framing. Choose at onboarding, affects how the app talks to you.
_Avoid_: Class, role, persona

**Quest**:
A discrete challenge with a clear win state, tied to real-world activity. Can be system-generated from templates or user-written. Completing quests earns XP and advances the narrative.
_Avoid_: Task, habit, goal (those are the real-world actions; quests are the gamified wrapper)

**Boss Battle**:
A high-stakes milestone challenge that tests accumulated skill. Appears at level transitions (every 10 levels) or when the user triggers one. Win unlocks permanent rewards; lose and retry.
_Avoid_: Challenge, test, exam

**Cumulative Completions**:
The primary progress metric — total count of activities completed over time. Replaces streaks as the main measure of consistency. Always goes up, never resets.
_Avoid_: Streak, chain, run (streaks exist but are secondary, with grace periods)

**Grace Period**:
Built-in allowance for missing 1-2 days per month without penalty. Designed into the system from day one, not added as an afterthought. Prevents anxiety-driven abandonment.
_Avoid_: Pause, freeze, break

**Recovery Key**:
A 12-24 word mnemonic phrase that serves as the user's identity. Enables cross-device data recovery without accounts, email, or phone. Must be saved during onboarding.
_Avoid_: Password, seed phrase, backup code

**Encrypted Blob**:
The unit of sync — an opaque, encrypted data package that the server stores but cannot read. Devices push/pull blobs; server has zero knowledge of contents.
_Avoid_: Data, file, package (too vague)

**XP (Experience Points)**:
Currency earned by completing quests and activities. Used to level up and unlock content. Earned at variable rates based on task difficulty and archetype.
_Avoid_: Points, score, credit

**Tier**:
Major progression milestones (Bronze → Silver → Gold → Platinum). Each tier unlocks new content, cosmetics, or capabilities. Within tiers, XP accumulates toward the next level.
_Avoid_: Rank, league, division

**Narrative Layer**:
The story infrastructure that gives mechanics meaning. User is always the protagonist. Quests are framed through archetype-specific language. Setbacks become plot complications, not failures.
_Aavoid_: Theme, story, lore (too decorative; this is structural)

**Archetype-Driven**:
The design principle that categories, quests, and narrative are filtered through the user's chosen archetype. Same habit feels different as "warrior training" vs "sage study."
_Avoid_: Personalized, customized (too generic)
