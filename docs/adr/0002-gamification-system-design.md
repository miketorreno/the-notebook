# ADR 0002: Gamification System Design

## Status

Accepted

## Context

We need a gamification system that:
1. Motivates long-term behavior change (not just novelty)
2. Works with privacy-first architecture (no social features, no server-side analytics)
3. Avoids anxiety-inducing mechanics (infinite streaks, punishment)
4. Provides depth without complexity

## Decision

We will use an **archetype-driven, cumulative completion** system:

1. **Archetypes**: 5 character classes (Warrior, Sage, Builder, Explorer, Monk) that frame how habits are presented
2. **Cumulative completions**: Primary metric is total activities completed (always goes up, never resets)
3. **Grace periods**: Built-in allowance for 1-2 missed days per month
4. **Exponential XP**: Levels require progressively more XP; tier milestones (Bronze → Silver → Gold → Platinum) unlock content
5. **Boss battles**: Milestone bosses at level transitions + user-triggered challenges
6. **Balanced bonus**: Extra XP for tracking across all three domains in a week

## Consequences

### Positive
- **Sustainable motivation**: Cumulative completions avoid streak anxiety
- **Identity investment**: Archetypes create emotional connection ("I'm a Sage" vs "I'm tracking reading")
- **Long-term depth**: Exponential curve + tiers provide months of progression
- **Milestone moments**: Boss battles create memorable achievements
- **Holistic tracking**: Balanced bonus encourages multi-domain engagement

### Negative
- **No social accountability**: Cannot implement leaderboards, parties, or shared quests (by design)
- **Template limitations**: System quests are pre-written; no AI narrative in v1
- **Onboarding choice**: Users must pick archetype early; may feel arbitrary

### Mitigations
- **Archetype flexibility**: Allow archetype change later (with narrative justification)
- **Rich templates**: Variable slots make quests feel personal without AI
- **Boss triggers**: User-triggered bosses let people challenge themselves when ready

## Alternatives Considered

1. **Streak-based system**: Traditional streaks create anxiety and punishment. Research shows cumulative completions are more sustainable. Streaks exist but are secondary, with grace periods.

2. **Social/party system**: Would add accountability but compromises privacy (requires user identification). Rejected for v1; revisit if anonymous social primitives emerge.

3. **AI-generated narrative**: Would create truly personalized quests. Requires sending data to LLM API (privacy concern) or running local model (complexity). Template-based for v1; local AI for v2.

4. **Fixed categories**: Simpler but less engaging. Archetype-driven creates stronger identity investment per research.

5. **Linear XP curve**: Simpler but less rewarding early. Exponential curve matches RPG conventions and feels better.
