<script lang="ts">
  import { onMount } from 'svelte'
  import type { Activity } from '../activity'
  import {
    openQuestStore,
    QUEST_STAR_XP,
    type QuestActivityEvent,
    type QuestChain,
    type QuestStep,
    type QuestStar,
    type QuestStore,
  } from '../quest'
  import {
    openProgressionStore,
    type ProgressionEvent,
    type ProgressionStore,
  } from '../progression'

  interface Props {
    key: CryptoKey
    dbName?: string
    /** The most recent activity logged by the sibling log panel. */
    activity?: Activity | null
    /** Called with the progression event whenever a quest grants XP. */
    onXp?: (event: ProgressionEvent) => void
  }

  const { key, dbName = 'the-platform', activity = null, onXp }: Props = $props()

  let questStore: QuestStore | undefined = $state(undefined)
  let progressionStore: ProgressionStore | undefined = $state(undefined)
  let chain = $state<QuestChain | null>(null)
  let notice = $state('')
  let lastProcessed = ''

  onMount(async () => {
    questStore = await openQuestStore(dbName)
    progressionStore = await openProgressionStore(dbName)
    await refresh()
  })

  $effect(() => {
    const current = activity
    if (!current) return
    const signal = `${current.id}:${current.completedAt}`
    if (signal === lastProcessed) return
    lastProcessed = signal
    void handleActivity(current)
  })

  async function refresh() {
    if (!questStore) return
    chain = await questStore.getChain(key)
  }

  async function handleActivity(current: Activity) {
    if (!questStore || !progressionStore) return
    const event = await questStore.recordActivity(current, key)
    if (event.xpEarned > 0) {
      const progressionEvent = await progressionStore.recordQuestXp(event.xpEarned, key)
      onXp?.(progressionEvent)
    }
    await refresh()
    setNotice(event)
  }

  function setNotice(event: QuestActivityEvent) {
    if (event.completedStepIds.length === 0 && event.upgradedStepIds.length === 0) {
      notice = ''
      return
    }
    if (event.chainCompleted) {
      notice = `Saga complete! Your final quest was won — you earned +${event.xpEarned} XP.`
    } else if (event.completedStepIds.length > 0 && event.upgradedStepIds.length > 0) {
      notice = `A quest was won and another rated up — +${event.xpEarned} XP.`
    } else if (event.completedStepIds.length > 0) {
      notice = `Quest complete! ${chain ? 'The next quest has unlocked' : ''} — +${event.xpEarned} XP.`
    } else {
      notice = `A quest rating climbed a star — +${event.xpEarned} XP.`
    }
  }

  function percentOf(step: QuestStep): number {
    const total = step.thresholds.baseline
    if (total <= 0) return 0
    return Math.min(100, Math.round((step.progress / total) * 100))
  }

  function starLabel(stars: QuestStar | 0): string {
    return '★'.repeat(stars) + '☆'.repeat(3 - stars)
  }

  const currentStep = $derived(
    chain?.steps.find((step) => step.status === 'current') ?? null,
  )
  const completedCount = $derived(
    chain?.steps.filter((step) => step.status === 'completed').length ?? 0,
  )
</script>

<section class="quest-panel surface">
  <div class="quest-header">
    <div>
      <h2 class="h2">Quest saga</h2>
      {#if chain}
        <p class="saga-line">
          {completedCount} of {chain.stepCount} steps won · foe: <strong>{chain.enemy}</strong>
        </p>
      {/if}
    </div>
    {#if chain?.status === 'complete'}
      <span class="saga-banner">Saga complete — a new saga begins with your next activity</span>
    {/if}
  </div>

  {#if notice}
    <p class="notice" role="status">{notice}</p>
  {/if}

  {#if chain && chain.status === 'active'}
    <ol class="quest-list">
      {#each chain.steps as step (step.id)}
        <li class="quest {step.status}">
          <div class="quest-main">
            <span class="quest-status">
              {#if step.status === 'completed'}
                <span class="done-mark" aria-hidden="true">✓</span>
              {:else if step.status === 'current'}
                <span class="now-mark" aria-hidden="true">▶</span>
              {:else}
                <span class="lock-mark" aria-hidden="true">●</span>
              {/if}
            </span>

            <div class="quest-body">
              <p class="quest-text">{step.text}</p>

              <div class="quest-meta">
                <span class="goal">Goal: {step.thresholds.baseline} {step.activityType} sessions
                  {step.domain === currentStep?.domain ? `(${step.domain})` : ''}
                </span>
                <span class="stars" aria-label="Star rating {step.stars} of 3">
                  {step.status === 'completed' ? starLabel(step.stars) : starLabel(0)}
                </span>
                <span class="thresholds">
                  ★ {step.thresholds.baseline} · ★★ {step.thresholds.elevated} · ★★★ {step.thresholds.maximum}
                </span>
                {#if step.status === 'completed'}
                  <span class="reward">+{step.xpEarned} XP</span>
                {:else}
                  <span class="reward">★ {QUEST_STAR_XP[1]} XP · ★★ {QUEST_STAR_XP[2]} XP · ★★★ {QUEST_STAR_XP[3]} XP</span>
                {/if}
              </div>

              {#if step.status === 'current'}
                <div class="progress-row">
                  <div
                    class="bar"
                    role="progressbar"
                    aria-label="Progress toward the quest win state"
                    aria-valuemin="0"
                    aria-valuemax={step.thresholds.baseline}
                    aria-valuenow={step.progress}
                  >
                    <div class="bar-fill" style:width="{percentOf(step)}%"></div>
                  </div>
                  <span class="count">{step.progress} / {step.thresholds.baseline}</span>
                </div>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ol>
  {:else if chain && chain.status === 'complete'}
    <p class="lead empty">Saga complete — a new saga will begin when you log your next activity.</p>
  {:else}
    <p class="lead empty">No quest saga yet — your saga begins when you log your first activity.</p>
  {/if}
</section>

<style>
  .quest-panel {
    width: 100%;
    max-width: 1100px;
    padding: 2rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .quest-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .h2 { margin: 0; }

  .saga-line {
    color: var(--color-surface-500);
    font-size: 0.9rem;
    margin: 0.25rem 0 0;
  }

  .saga-banner {
    padding: 0.4rem 0.8rem;
    border-radius: 9999px;
    background: var(--color-primary-100);
    color: var(--color-primary-600);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .notice {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-base);
    background: var(--color-primary-100);
    color: var(--color-primary-600);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .quest-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .quest {
    padding: 1rem 1.25rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
  }

  .quest.locked {
    opacity: 0.55;
  }

  .quest.current {
    border-color: var(--color-primary-400);
    background: var(--color-primary-50);
  }

  .quest-main {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
  }

  .quest-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    margin-top: 0.15rem;
    flex-shrink: 0;
  }

  .done-mark {
    color: var(--color-success-500, #2f9e44);
    font-weight: 700;
  }

  .now-mark {
    color: var(--color-primary-400);
    font-size: 0.8rem;
  }

  .lock-mark {
    color: var(--color-surface-400);
    font-size: 0.5rem;
  }

  .quest-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .quest-text {
    margin: 0;
    font-weight: 600;
    line-height: 1.5;
  }

  .quest-meta {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--color-surface-500);
  }

  .goal {
    font-weight: 700;
    color: var(--color-surface-600);
  }

  .stars {
    color: var(--color-primary-500);
    letter-spacing: 1px;
  }

  .thresholds {
    font-family: monospace;
  }

  .reward {
    color: var(--color-primary-400);
    font-weight: 700;
  }

  .progress-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.35rem;
  }

  .bar {
    flex: 1;
    height: 8px;
    border-radius: 9999px;
    background: var(--color-surface-200);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: var(--color-primary-500);
    transition: width 0.3s ease;
  }

  .count {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-surface-600);
    font-family: monospace;
  }

  .empty {
    font-style: italic;
    margin: 0;
  }
</style>