# Spec: Privacy-First Gamified Life Tracker

**Status: ready-for-agent**

## Problem Statement

Privacy-conscious individuals want to track their life progress (Health, Learning, Productivity) through gamification, but existing trackers either compromise privacy (account-based, server-side data) or lack depth (simple checkboxes, streak-only systems). The result is either privacy-respecting tools that are boring, or engaging tools that require surrendering personal data.

## Solution

A local-first, E2E encrypted PWA that turns daily habits into an RPG adventure. Users choose an archetype (Warrior, Sage, Builder, Explorer, Monk) that frames how habits are presented, complete quest chains and boss battles, and accumulate progress through cumulative completions (not anxiety-inducing streaks). No accounts, no email, no phone — just a recovery key for cross-device sync via encrypted blobs.

## User Stories

#### Onboarding & Identity
1. As a privacy-conscious user, I want to start using the app without creating an account, so that my personal information is never collected
2. As a user, I want to receive a recovery key (mnemonic phrase) during onboarding, so that I can recover my data on a new device
3. As a user, I want to be forced to save my recovery key before proceeding, so that I don't accidentally lose my data
4. As a user, I want to choose an archetype during onboarding, so that the app feels personalized to my goals
5. As a user, I want to understand what each archetype means before choosing, so that I pick one that resonates
6. As a user, I want to set my first quest immediately after choosing an archetype, so that I can start tracking right away
7. As a user, I want the onboarding to take less than 60 seconds after saving my key, so that I don't lose interest

#### Activity Tracking
8. As a user, I want to log Health activities (exercise, sleep, nutrition, meditation), so that I can track my physical wellbeing
9. As a user, I want to log Learning activities (courses, reading, skill practice), so that I can track my intellectual growth
10. As a user, I want to log Productivity activities (work tasks, habits, routines), so that I can track my output
11. As a user, I want to categorize activities by domain (Health, Learning, Productivity), so that I can see where I'm spending effort
12. As a user, I want to add custom activity types, so that I can track what matters to me
13. As a user, I want to log an activity with one tap (quick log), so that tracking doesn't feel like work
14. As a user, I want to add notes or details to an activity, so that I can remember context later
15. As a user, I want to see my activity history, so that I can reflect on patterns

#### XP & Progression
16. As a user, I want to earn XP for completing activities, so that I feel rewarded for consistency
17. As a user, I want XP rewards to vary by difficulty (Easy/Medium/Hard), so that harder work feels more valuable
18. As a user, I want to level up when I accumulate enough XP, so that I see tangible progress
19. As a user, I want an exponential XP curve (100, 250, 500, 1000...), so that early levels feel quick while later levels feel earned
20. As a user, I want tier milestones (Bronze → Silver → Gold → Platinum), so that I have major goals to work toward
21. As a user, I want to see my current XP, level, and tier at all times, so that I always know where I stand
22. As a user, I want a "Well-Rounded" bonus for tracking across all three domains in a week, so that I'm incentivized to maintain balance

#### Archetypes
23. As a user, I want my archetype to frame how the app talks about my habits, so that tracking feels thematic, not clinical
24. As a user, I want the Warrior archetype to frame Health as "training", so that exercise feels like character development
25. As a user, I want the Sage archetype to frame Learning as "study", so that reading feels like skill-building
26. As a user, I want the Builder archetype to frame Productivity as "crafting", so that work feels like creation
27. As a user, I want to change my archetype later (with narrative justification), so that I'm not locked in

#### Quests
28. As a user, I want system-generated quests from templates, so that I have structure without decision fatigue
29. As a user, I want to create custom quests, so that I can define my own challenges
30. As a user, I want quest templates with variable slots ("Complete {count} {activity} to defeat the {enemy}"), so that they feel personal
31. As a user, I want quests to have clear win states (objective, measurable), so that I know exactly when I've succeeded
32. As a user, I want quests to chain (completing one unlocks the next), so that I have narrative momentum
33. As a user, I want quest chains to be 3-7 steps, so that they're completable without fatigue
34. As a user, I want early quests to be quick wins, so that I build confidence
35. As a user, I want later quests to be more challenging, so that I feel growth
36. As a user, I want three-star grading on quests (baseline + elevated + maximum), so that I can push myself if I want
37. As a user, I want to see progress bars on active quests, so that I know how close I am to completion

#### Boss Battles
38. As a user, I want milestone bosses at level transitions (every 10 levels), so that I have major challenges to anticipate
39. As a user, I want to trigger boss battles myself, so that I can test myself when ready
40. As a user, I want boss battles to have real stakes (win = permanent rewards, lose = retry), so that they feel meaningful
41. As a user, I want boss difficulty to be calibrated to my current level, so that they feel challenging but winnable
42. As a user, I want boss battles to have narrative context ("The Doubt Demon appears because you skipped meditation 3 times"), so that they feel connected to my real actions
43. As a user, I want to see boss health bars and my pending damage, so that I understand the battle's progress

#### Cumulative Completions & Grace
44. As a user, I want my primary metric to be cumulative completions (total activities done), so that my progress always goes up
45. As a user, I want grace periods (1-2 missed days per month without penalty), so that life doesn't feel punitive
46. As a user, I want to see my cumulative count prominently, so that I'm motivated by how much I've done
47. As a user, I want to see my "current streak" as secondary info (with grace), so that I know consistency without anxiety
48. As a user, I want to miss a day without guilt, so that I don't abandon the app

#### Data & Privacy
49. As a user, I want all data stored locally (IndexedDB), so that my information never leaves my device without my consent
50. As a user, I want my data encrypted with AES-256-GCM, so that even if my device is compromised, my data is protected
51. As a user, I want a transparency dashboard showing what's stored locally and what's encrypted, so that I can verify privacy claims
52. As a user, I want to export all my data as JSON, so that I can back it up or move to another tool
53. As a user, I want to delete all my data permanently, so that I can leave without a trace
54. As a user, I want the code to be open source, so that I can verify the privacy architecture myself
55. As a user, I want E2E encrypted sync via encrypted blobs, so that I can access my data on multiple devices
56. As a user, I want the sync server to have zero knowledge of my data, so that I trust it with my information

#### Visual & UX
57. As a user, I want an abstract/symbolic visual design (no literal fantasy art), so that the app feels timeless and professional
58. As a user, I want dark mode support, so that I can use the app comfortably at night
59. As a user, I want a clean dashboard showing my progress at a glance, so that I can check in quickly
60. As a user, I want progress visualized through shapes and colors (not just numbers), so that I can see growth intuitively
61. As a user, I want the app to feel fast and responsive, so that tracking doesn't feel like a chore
62. As a user, I want the app to work offline, so that I can track anywhere without internet

#### Achievements & Badges
63. As a user, I want achievements for milestones (first quest, 100 completions, first boss defeat), so that I have long-term goals
64. As a user, I want badges to be permanent (never expire), so that I keep what's earned
65. As a user, I want to see my achievement collection, so that I can track my accomplishments
66. As a user, I want some achievements to be hidden (surprise unlocks), so that I have moments of delight

## Implementation Decisions

#### Architecture
- **PWA**: Svelte + Vite + Skeleton UI, installable on iOS/Android/Desktop
- **Local-first**: All data in IndexedDB, encrypted with AES-256-GCM
- **Identity**: Recovery key (mnemonic phrase) generated client-side, never sent to server
- **Sync (v1)**: Server stores encrypted blobs; zero knowledge of contents
- **Open source**: Full codebase available for verification

#### Data Schema (High-Level)
- **User/Dossier**: archetype, recovery key (derived), created_at
- **Activity**: id, domain (Health/Learning/Productivity), type, difficulty, notes, completed_at, XP_earned
- **Quest**: id, template_id (system) or custom (user), status, progress, started_at, completed_at
- **Progression**: level, XP, tier, cumulative_completions, grace_days_used
- **Achievement**: id, unlocked_at, type
- **BossBattle**: id, type (milestone/user-triggered), status, health, damage_dealt

#### XP Curve
- Level 1→2: 100 XP
- Level 2→3: 250 XP
- Level 3→4: 500 XP
- Formula: `100 * (level ^ 1.5)`
- Tier thresholds: Bronze (Level 10), Silver (Level 25), Gold (Level 50), Platinum (Level 100)

#### Quest Templates
- Variable slots: `{count}`, `{activity}`, `{domain}`, `{enemy}`, `{archetype}`
- Example: "Complete {count} {activity} sessions to defeat the {enemy}"
- System generates from user's activity patterns
- User-created quests use same schema but user fills in fields

#### Boss Battle Mechanics
- Milestone bosses: Appear at levels 10, 20, 30, 40, 50, 75, 100
- User-triggered: Available after level 5, cooldown period between triggers
- Health scales with user level
- Damage dealt = sum of activities completed since battle started

#### Grace Period Mechanics
- 2 grace days per 30-day period
- Grace days reset monthly
- Cumulative completions never decrease
- Secondary streak counter uses grace days

#### Cross-Domain Bonus
- "Well-Rounded" achievement for completing activities in all 3 domains within 7 days
- Bonus: 1.5x XP multiplier for the week
- Visual: Special badge/icon on dashboard

## Testing Decisions

- **External behavior only**: Test what the user sees and does, not internal implementation
- **Modules to test**: Activity logging, XP calculation, quest progression, boss battles, data encryption, recovery key generation/recovery
- **Key test scenarios**: Onboarding flow, activity logging across domains, XP/level transitions, quest completion chains, boss battle win/loss, data export/import, recovery key backup/restore

## Out of Scope

- **v2 features**: User-created quests, AI-generated narrative, P2P sync, social features (anonymous challenges), import from competitors
- **Mobile apps**: Native iOS/Android apps (PWA first)
- **Advanced analytics**: Trend analysis, predictive insights (v1 is tracking, not analytics)
- **Wearable integration**: No Fitbit/Apple Watch sync in v1
- **Multi-language**: English only for v1

## Further Notes

- **Privacy is the differentiator**: Every architectural decision should be justifiable through the privacy lens. If a feature requires sending data to a server, it doesn't ship in v1.
- **Narrative depth over breadth**: Better to have 5 archetypes with rich framing than 20 with shallow differences.
- **Recovery key UX is critical**: This is where most privacy-first apps fail. Invest heavily in onboarding education and key management.
- **Open source from day one**: Don't wait for v1 to release code. The target audience (privacy-conscious individuals) will want to verify before committing.
