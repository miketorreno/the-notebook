<script lang="ts">
  import {
    ALL_ARCHETYPES,
    DOMAINS,
    getCurrentArchetype,
    type ArchetypeId,
  } from '../archetype'

  interface Props {
    selected?: ArchetypeId | null
    onSelect: (id: ArchetypeId) => void
  }

  const { selected = null, onSelect }: Props = $props()

  function initialSelection(): ArchetypeId | null {
    return selected
  }
  let chosen = $state<ArchetypeId | null>(initialSelection())

  const current = getCurrentArchetype()
  const isChanging = !!current

  function choose(id: ArchetypeId) {
    chosen = id
  }
</script>

<div class="archetype-picker">
  {#if isChanging}
    <p class="lead">
      You are currently a <strong>{current.name}</strong>. Every path below reframes how your
      Health, Learning, and Productivity are described.
    </p>
  {:else}
    <p class="lead">
      Choose the archetype that frames your journey. Each one changes how the app talks about your
      Health, Learning, and Productivity.
    </p>
  {/if}

  <div class="cards">
    {#each ALL_ARCHETYPES as archetype (archetype.id)}
      {@const active = chosen === archetype.id}
      <button
        type="button"
        class="card surface {active ? 'active' : ''}"
        aria-pressed={active}
        onclick={() => choose(archetype.id)}
      >
        <span class="archetype-name">{archetype.name}</span>
        <span class="archetype-tagline">{archetype.tagline}</span>
        <span class="archetype-desc">{archetype.description}</span>
        <span class="framing">
          {#each DOMAINS as domain (domain)}
            <span class="framing-row">
              <span class="framing-domain">{domain}</span>
              <span class="framing-term">{archetype.framing[domain]}</span>
            </span>
          {/each}
        </span>
      </button>
    {/each}
  </div>

  <div class="actions">
    <button
      class="btn variant-filled-primary"
      disabled={!chosen}
      onclick={() => chosen && onSelect(chosen)}
    >
      {isChanging ? 'Change archetype' : 'Choose this archetype'}
    </button>
  </div>
</div>

<style>
  .archetype-picker {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    align-items: center;
  }

  .lead {
    line-height: 1.7;
    color: var(--color-surface-600);
    text-align: center;
    max-width: 560px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    width: 100%;
    max-width: 780px;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    padding: 1.5rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    background: var(--color-surface-100);
    color: var(--color-surface-contrast-100);
    cursor: pointer;
    transition: transform 0.1s ease, border-color 0.1s ease;
  }

  .card:hover {
    border-color: var(--color-primary-400);
  }

  .card.active {
    border-color: var(--color-primary-500);
    outline: 2px solid color-mix(in oklab, var(--color-primary-500) 40%, transparent);
  }

  .archetype-name {
    font-weight: 700;
    font-size: 1.15rem;
  }

  .archetype-tagline {
    color: var(--color-primary-400);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .archetype-desc {
    color: var(--color-surface-600);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .framing {
    margin-top: 0.5rem;
    border-top: 1px solid var(--color-surface-200);
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .framing-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .framing-domain {
    color: var(--color-surface-500);
    font-weight: 600;
  }

  .framing-term {
    color: var(--color-surface-contrast-100);
    font-style: italic;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }
</style>
