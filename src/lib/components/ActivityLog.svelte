<script lang="ts">
  import { onMount } from 'svelte'
  import {
    buildActivity,
    calculateXp,
    DEFAULT_ACTIVITY_TYPES,
    DIFFICULTIES,
    openActivityStore,
    type Activity,
    type ActivityStore,
    type ActivityType,
    type Difficulty,
  } from '../activity'
  import { DOMAINS, type Domain } from '../archetype'

  interface Props {
    key: CryptoKey
    dbName?: string
  }

  const { key, dbName = 'the-platform' }: Props = $props()

  let store: ActivityStore | undefined = $state(undefined)
  let difficulty = $state<Difficulty>('Medium')
  let notes = $state('')
  let history: Activity[] = $state([])
  let customTypes: ActivityType[] = $state([])
  let newType = $state('')
  let newTypeDomain = $state<Domain>('Health')
  let error = $state('')

  onMount(async () => {
    store = await openActivityStore(dbName)
    await refresh()
  })

  async function refresh() {
    if (!store) return
    history = await store.listActivities(key)
    customTypes = await store.listActivityTypes(key)
  }

  function typesFor(domain: Domain): string[] {
    const defaults = DEFAULT_ACTIVITY_TYPES[domain]
    const customs = customTypes.filter((t) => t.domain === domain).map((t) => t.value)
    return [...defaults, ...customs]
  }

  async function log(domain: Domain, type: string) {
    if (!store) return
    const activity = buildActivity({
      domain,
      type,
      difficulty,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })
    await store.logActivity(activity, key)
    if (notes.trim()) notes = ''
    await refresh()
  }

  async function createType() {
    if (!store) return
    const value = newType.trim()
    if (!value) return
    if (typesFor(newTypeDomain).some((t) => t.toLowerCase() === value.toLowerCase())) {
      error = 'That activity type already exists in this domain.'
      return
    }
    await store.setActivityType(value, newTypeDomain, key)
    newType = ''
    error = ''
    await refresh()
  }
</script>

<section class="activity-log">
  <div class="log-panel surface">
    <h2 class="h2">Log an activity</h2>
    <p class="lead">One tap to log. Choose difficulty and optional notes first, then tap an activity.</p>

    <div class="controls">
      <div class="difficulty">
        <span class="control-label">Difficulty</span>
        <div class="segmented">
          {#each DIFFICULTIES as d (d)}
            <button
              class="seg {difficulty === d ? 'active' : ''}"
              aria-pressed={difficulty === d}
              onclick={() => { difficulty = d }}
            >
              {d} · {calculateXp(d)} XP
            </button>
          {/each}
        </div>
      </div>

      <label class="notes">
        <span class="control-label">Notes (optional)</span>
        <input
          type="text"
          class="input"
          bind:value={notes}
          placeholder="e.g. 30 min, evening session..."
        />
      </label>
    </div>

    <div class="domains">
      {#each DOMAINS as domain (domain)}
        <div class="domain-block">
          <h3 class="h3">{domain}</h3>
          <div class="chips">
            {#each typesFor(domain) as type (type)}
              <button
                class="chip-btn"
                onclick={() => log(domain, type)}
                title="Log {type} ({difficulty})"
              >
                {type}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <form class="custom" onsubmit={(e) => { e.preventDefault(); createType() }}>
      <span class="control-label">Add custom activity type</span>
      <div class="custom-row">
        <input type="text" class="input" bind:value={newType} placeholder="New activity type" />
        <select class="select" bind:value={newTypeDomain} aria-label="Domain">
          {#each DOMAINS as domain (domain)}
            <option value={domain}>{domain}</option>
          {/each}
        </select>
        <button class="btn variant-soft" disabled={!newType.trim()}>Add</button>
      </div>
      {#if error}
        <p class="error">{error}</p>
      {/if}
    </form>
  </div>

  <div class="history surface">
    <h2 class="h2">Activity history</h2>
    {#if history.length === 0}
      <p class="lead empty">No activities logged yet. Tap an activity above to begin.</p>
    {:else}
      <ul class="history-list">
        {#each history as activity (activity.id)}
          <li class="history-item">
            <div class="history-main">
              <span class="badge">{activity.domain}</span>
              <span class="history-type">{activity.type}</span>
              <span class="history-diff">{activity.difficulty}</span>
            </div>
            <div class="history-meta">
              {#if activity.notes}
                <span class="history-notes">{activity.notes}</span>
              {/if}
              <span class="history-xp">+{activity.xp} XP</span>
              <span class="history-time">{new Date(activity.completedAt).toLocaleString()}</span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .activity-log {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    width: 100%;
    max-width: 1100px;
    text-align: left;
  }

  .log-panel, .history {
    padding: 2rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .h2 { margin: 0; }
  .h3 { margin: 0.25rem 0 0.5rem; color: var(--color-primary-400); }

  .lead { color: var(--color-surface-600); line-height: 1.6; margin: 0; }
  .empty { font-style: italic; }

  .controls { display: flex; flex-direction: column; gap: 0.75rem; }

  .control-label { font-size: 0.8rem; font-weight: 700; color: var(--color-surface-500); text-transform: uppercase; letter-spacing: 0.3px; }

  .segmented { display: flex; gap: 0.4rem; }
  .seg {
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
    color: var(--color-surface-contrast-100);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .seg.active { border-color: var(--color-primary-500); color: var(--color-primary-400); font-weight: 700; }

  .notes { display: flex; flex-direction: column; gap: 0.35rem; }
  .input, .select {
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
    color: var(--color-surface-contrast-100);
  }

  .domains { display: flex; flex-direction: column; gap: 1rem; }
  .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
    color: var(--color-surface-contrast-100);
    cursor: pointer;
    transition: transform 0.05s ease, border-color 0.1s ease;
  }
  .chip-btn:hover { border-color: var(--color-primary-400); transform: translateY(-1px); }

  .custom { display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--color-surface-200); padding-top: 1rem; }
  .custom-row { display: flex; gap: 0.5rem; }
  .custom-row .input { flex: 1; }
  .error { color: var(--color-error-500); font-size: 0.85rem; margin: 0; }

  .history-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; max-height: 480px; overflow-y: auto; }
  .history-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-base);
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
  }
  .history-main { display: flex; align-items: center; gap: 0.5rem; }
  .badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 0.15rem 0.5rem; border-radius: 9999px; background: var(--color-primary-100); color: var(--color-primary-600); }
  .history-type { font-weight: 600; }
  .history-diff { font-size: 0.75rem; color: var(--color-surface-500); }
  .history-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; color: var(--color-surface-500); }
  .history-notes { font-style: italic; }
  .history-xp { color: var(--color-primary-400); font-weight: 700; }
  .history-time { margin-left: auto; }

  @media (max-width: 900px) {
    .activity-log { grid-template-columns: 1fr; }
  }
</style>
