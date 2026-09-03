<script lang="ts">
  import { onMount } from 'svelte'
  import Onboarding from './lib/components/Onboarding.svelte'
  import ArchetypeSelector from './lib/components/ArchetypeSelector.svelte'
  import { needsOnboarding, saveRecoverySalt } from './lib/mnemonic'
  import { generateSalt } from './lib/crypto/crypto'
  import {
    getCurrentArchetype,
    getArchetype,
    recordArchetypeChange,
    setArchetype,
    type ArchetypeId,
  } from './lib/archetype'

  let mode: 'light' | 'dark' = $state('light')
  let onboarded = $state(false)
  let loading = $state(true)
  let changingArchetype = $state(false)
  let changeStep: 'select' | 'justify' = $state('select')
  let pendingArchetype = $state<ArchetypeId | null>(null)
  let justification = $state('')

  onMount(() => {
    const stored = localStorage.getItem('theme-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    mode = stored === 'dark' || (stored === null && prefersDark) ? 'dark' : 'light'
    applyMode(mode)

    onboarded = !needsOnboarding()
    loading = false
  })

  function toggleMode() {
    mode = mode === 'dark' ? 'light' : 'dark'
    applyMode(mode)
    localStorage.setItem('theme-mode', mode)
  }

  function applyMode(next: 'light' | 'dark') {
    document.documentElement.dataset.mode = next
  }

  async function handleOnboardingComplete({
    mnemonic: _mnemonic,
    archetype,
  }: {
    mnemonic: string
    archetype: ArchetypeId
  }) {
    // Persist the non-secret salt; the AES key is re-derived from the
    // recovery phrase + salt on demand (see crypto/deriveKey). Nothing is
    // sent to a server.
    const salt = generateSalt()
    saveRecoverySalt(salt)
    setArchetype(archetype)
    onboarded = true
  }

  function handleArchetypeChanged() {
    changingArchetype = false
  }

  function beginArchetypeChange() {
    changingArchetype = true
    changeStep = 'select'
    pendingArchetype = null
    justification = ''
  }

  function confirmArchetypeChange() {
    if (pendingArchetype) {
      recordArchetypeChange(pendingArchetype, justification)
    }
    handleArchetypeChanged()
  }
</script>

<svelte:head>
  <title>The Platform</title>
</svelte:head>

<div class="app-shell base-root">
  <header class="app-bar surface">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 512 512" width="28" height="28">
          <circle cx="256" cy="256" r="128" fill="none" stroke="currentColor" stroke-width="56" />
          <circle cx="256" cy="256" r="44" fill="currentColor" />
          <circle cx="370" cy="142" r="30" fill="currentColor" opacity="0.6" />
          <circle cx="142" cy="370" r="30" fill="currentColor" opacity="0.6" />
        </svg>
      </span>
      <span class="brand-name">The Platform</span>
    </div>
    <button class="mode-toggle btn variant-soft" onclick={toggleMode} aria-label="Toggle dark mode">
      {#if mode === 'dark'}Light mode{:else}Dark mode{/if}
    </button>
  </header>

  {#if loading}
    <main class="content">
      <p>Loading...</p>
    </main>
  {:else if !onboarded}
    <Onboarding onComplete={handleOnboardingComplete} />
  {:else}
    <main class="content">
      {#if changingArchetype}
        {#if changeStep === 'select'}
          <section class="card surface">
            <h1 class="h2">Change your archetype</h1>
            <p class="lead">
              Your path is not fixed. Choose the path that calls to you now.
            </p>
            <ArchetypeSelector
              selected={getCurrentArchetype()?.id}
              onSelect={(id) => {
                pendingArchetype = id
                changeStep = 'justify'
              }}
            />
          </section>
        {:else}
          <section class="card surface">
            <h1 class="h2">Why the new path?</h1>
            <p class="lead">
              Every change of path has a story. Write the reason you are leaving behind
              {getCurrentArchetype()?.name ?? 'your current path'} for
              <strong>{pendingArchetype ? getArchetype(pendingArchetype)?.name : ''}</strong>.
            </p>
            <textarea
              class="textarea"
              bind:value={justification}
              placeholder="What changed for you? Why does this path fit better now?"
              rows="4"
            ></textarea>
            <div class="actions">
              <button class="btn variant-soft" onclick={beginArchetypeChange}>
                Back
              </button>
              <button
                class="btn variant-filled-primary"
                disabled={justification.trim().length === 0}
                onclick={confirmArchetypeChange}
              >
                Confirm change
              </button>
            </div>
          </section>
        {/if}
      {:else}
        <section class="hero surface">
          <div class="hero-mark" aria-hidden="true">
            {#each [0, 1, 2] as i}
              <span class="orbit orbit-{i}">
                <span class="node"></span>
              </span>
            {/each}
            <span class="core"></span>
          </div>
          <h1 class="h1">All of your life, one encrypted vault.</h1>
          <p class="lead">
            The Platform will turn Health, Learning, and Productivity into an
            RPG adventure — stored locally, encrypted with AES-256-GCM, and never sent
            anywhere without your consent.
          </p>
          {#if getCurrentArchetype()}
            <p class="archetype-note">
              You are the <strong>{getCurrentArchetype()?.name}</strong> — your
              Health is "{getCurrentArchetype()?.framing.Health}", your Learning is
              "{getCurrentArchetype()?.framing.Learning}", your Productivity is
              "{getCurrentArchetype()?.framing.Productivity}".
            </p>
          {/if}
          <button class="btn variant-soft" onclick={beginArchetypeChange}>
            Change archetype
          </button>
          <p class="tags">
            <span class="chip variant-filled-surface">Local-first</span>
            <span class="chip variant-filled-surface">E2E encrypted</span>
            <span class="chip variant-filled-surface">No accounts</span>
          </p>
        </section>
      {/if}
    </main>
  {/if}

  <footer class="footer">
    {#if onboarded}
      <span>Your recovery key and archetype are saved locally.</span>
    {:else}
      <span>Set up your recovery key to get started.</span>
    {/if}
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  .app-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-surface-200);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-name {
    font-weight: 700;
    letter-spacing: 0.4px;
  }

  .brand-mark {
    display: inline-flex;
    color: var(--color-primary-500);
  }

  .content {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
  }

  .hero {
    max-width: 640px;
    text-align: center;
    padding: 3rem 2rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .hero-mark {
    position: relative;
    width: 160px;
    height: 160px;
    display: grid;
    place-items: center;
    margin-bottom: 0.5rem;
  }

  .core {
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    background: var(--color-primary-500);
    box-shadow: 0 0 0 6px color-mix(in oklab, var(--color-primary-500) 20%, transparent);
  }

  .orbit {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    animation: spin var(--orbit-duration, 20s) linear infinite;
  }

  .orbit-0 {
    --orbit-duration: 20s;
    border-radius: 9999px;
    border: 1px dashed color-mix(in oklab, var(--color-primary-500) 50%, transparent);
  }

  .orbit-1 {
    --orbit-duration: 14s;
    inset: 20px;
    border-radius: 9999px;
    border: 1px dashed color-mix(in oklab, var(--color-primary-400) 40%, transparent);
    animation-direction: reverse;
  }

  .orbit-2 {
    --orbit-duration: 26s;
    inset: 40px;
    border-radius: 9999px;
    border: 1px dashed color-mix(in oklab, var(--color-primary-300) 35%, transparent);
  }

  .node {
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    background: var(--color-primary-400);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .lead {
    line-height: 1.7;
    color: var(--color-surface-600);
  }

  .archetype-note {
    color: var(--color-surface-600);
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .card {
    max-width: 560px;
    width: 100%;
    padding: 2.5rem 2rem;
    border-radius: var(--radius-container);
    border: 1px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    text-align: center;
  }

  .textarea {
    width: 100%;
    font-family: monospace;
    resize: vertical;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .footer {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-surface-500);
    font-size: 0.9rem;
  }
</style>
