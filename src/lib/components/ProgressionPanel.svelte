<script lang="ts">
  import { onMount } from 'svelte'
  import {
    openProgressionStore,
    type ProgressionEvent,
    type ProgressionInfo,
    type ProgressionStore,
  } from '../progression'

  interface Props {
    key: CryptoKey
    dbName?: string
    /** The most recent completion recorded by the sibling log panel. */
    event?: ProgressionEvent | null
  }

  const { key, dbName = 'the-platform', event = null }: Props = $props()

  let store: ProgressionStore | undefined = $state(undefined)
  let progression = $state<ProgressionInfo | null>(null)
  let levelUpNotice = $state('')

  onMount(async () => {
    store = await openProgressionStore(dbName)
    await refresh()
  })

  $effect(() => {
    event
    void refresh()
  })

  async function refresh() {
    if (!store) return
    progression = await store.get(key)
    if (event?.leveledUp) {
      levelUpNotice = `Level up! ${event.previous.level} → ${event.progression.level}`
      setTimeout(() => { levelUpNotice = '' }, 4000)
    }
  }

  const progressPercent = $derived(
    progression ? Math.round((progression.xpIntoLevel / progression.xpToNextLevel) * 100) : 0,
  )
</script>

<section class="progression">
  <div class="metric level">
    <span class="metric-label">Level</span>
    <span class="metric-value">{progression?.level ?? '–'}</span>
  </div>

  <div class="metric xp">
    <span class="metric-label">XP</span>
    <div class="xp-row">
      <span class="metric-value">
        {progression ? `${progression.xpIntoLevel} / ${progression.xpToNextLevel}` : '–'}
      </span>
      <span class="xp-total">{progression?.totalXp ?? 0} total</span>
    </div>
    <div
      class="bar"
      role="progressbar"
      aria-label="Progress to next level"
      aria-valuemin="0"
      aria-valuemax={progression?.xpToNextLevel ?? 0}
      aria-valuenow={progression?.xpIntoLevel ?? 0}
    >
      <div class="bar-fill" style:width="{progressPercent}%"></div>
    </div>
  </div>

  <div class="metric tier">
    <span class="metric-label">Tier</span>
    <span class="metric-value">{progression?.tier ?? '—'}</span>
  </div>

  <div class="metric completions">
    <span class="metric-label">Cumulative completions</span>
    <span class="metric-value">{progression?.cumulativeCompletions ?? 0}</span>
  </div>

  {#if levelUpNotice}
    <div class="level-up" role="status">{levelUpNotice}</div>
  {/if}
</section>

<style>
  .progression {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    width: 100%;
    max-width: 1100px;
    padding: 1.25rem 1.5rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    position: relative;
    margin-bottom: 1.5rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .metric-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--color-surface-500);
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-contrast-100);
    line-height: 1.1;
  }

  .tier .metric-value {
    color: var(--color-primary-400);
  }

  .xp-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .xp-total {
    font-size: 0.8rem;
    color: var(--color-surface-500);
  }

  .bar {
    height: 8px;
    border-radius: 9999px;
    background: var(--color-surface-200);
    overflow: hidden;
    margin-top: 0.35rem;
  }

  .bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: var(--color-primary-500);
    transition: width 0.3s ease;
  }

  .level-up {
    position: absolute;
    inset: -12px 0 auto auto;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-base);
    background: var(--color-primary-500);
    color: var(--color-primary-contrast, #fff);
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: var(--shadow-elevation-base);
  }

  @media (max-width: 700px) {
    .progression { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>