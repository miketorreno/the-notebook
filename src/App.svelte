<script lang="ts">
  import { onMount } from 'svelte'
  import Onboarding from './lib/components/Onboarding.svelte'
  import ArchetypeSelector from './lib/components/ArchetypeSelector.svelte'
  import ActivityLog from './lib/components/ActivityLog.svelte'
  import ProgressionPanel from './lib/components/ProgressionPanel.svelte'
  import QuestPanel from './lib/components/QuestPanel.svelte'
  import type { Activity } from './lib/activity'
  import {
    needsOnboarding,
    saveRecoverySalt,
    loadRecoverySalt,
    normalizeMnemonic,
    validateMnemonic,
  } from './lib/mnemonic'
  import { deriveKey, generateSalt } from './lib/crypto/crypto'
  import { openActivityStore } from './lib/activity'
  import {
    getCurrentArchetype,
    getArchetype,
    recordArchetypeChange,
    setArchetype,
    type ArchetypeId,
  } from './lib/archetype'
  import type { ProgressionEvent } from './lib/progression'

  let mode: 'light' | 'dark' = $state('light')
  let onboarded = $state(false)
  let loading = $state(true)
  let sessionKey = $state<CryptoKey | null>(null)
  let unlockInput = $state('')
  let unlockError = $state(false)
  let changingArchetype = $state(false)
  let changeStep: 'select' | 'justify' = $state('select')
  let pendingArchetype = $state<ArchetypeId | null>(null)
  let justification = $state('')
  let lastProgressionEvent = $state<ProgressionEvent | null>(null)
  let lastActivity = $state<Activity | null>(null)

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
    mnemonic,
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
    sessionKey = await deriveKey(mnemonic, salt)
    onboarded = true
  }

  async function handleUnlock() {
    const salt = loadRecoverySalt()
    if (!salt) {
      onboarded = false
      return
    }
    const phrase = normalizeMnemonic(unlockInput)
    if (!validateMnemonic(phrase)) {
      unlockError = true
      return
    }
    const key = await deriveKey(phrase, salt)
    // Verify the key can actually decrypt the vault before unlocking; a
    // well-formed-but-wrong phrase must not crash the activity view later.
    const store = await openActivityStore('the-platform')
    try {
      await store.listActivities(key)
    } catch {
      unlockError = true
      return
    } finally {
      await store.destroy()
    }
    sessionKey = key
    unlockInput = ''
    unlockError = false
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
    {#if !sessionKey}
      <main class="content">
        <section class="card surface unlock">
          <h1 class="h2">Unlock your vault</h1>
          <p class="lead">
            Your recovery key stays only in your head (or your safe place). Enter it to
            decrypt your activity data for this session. It is never sent anywhere.
          </p>
          <textarea
            class="textarea"
            bind:value={unlockInput}
            placeholder="Enter your recovery key..."
            rows="3"
          ></textarea>
          {#if unlockError}
            <p class="error">That recovery key is invalid or cannot unlock this vault. Please check it and try again.</p>
          {/if}
          <button class="btn variant-filled-primary" onclick={handleUnlock}>
            Unlock
          </button>
        </section>
      </main>
    {:else if changingArchetype}
      <main class="content">
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
      </main>
    {:else}
      <main class="content activity-main">
        {#if getCurrentArchetype()}
          <p class="archetype-note">
            You are the <strong>{getCurrentArchetype()?.name}</strong> — Health is
            "{getCurrentArchetype()?.framing.Health}", Learning is
            "{getCurrentArchetype()?.framing.Learning}", Productivity is
            "{getCurrentArchetype()?.framing.Productivity}".
            <button class="btn variant-soft sm" onclick={beginArchetypeChange}>Change archetype</button>
          </p>
        {/if}
        <ProgressionPanel key={sessionKey} event={lastProgressionEvent} />
        <QuestPanel
          key={sessionKey}
          activity={lastActivity}
          onXp={(event) => (lastProgressionEvent = event)}
        />
        <ActivityLog
          key={sessionKey}
          onLog={(event) => (lastProgressionEvent = event)}
          onActivity={(activity) => (lastActivity = activity)}
        />
      </main>
    {/if}
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

  .content {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
  }

  .activity-main {
    width: 100%;
    align-items: start;
    justify-items: center;
  }

  .lead {
    line-height: 1.7;
    color: var(--color-surface-600);
  }

  .archetype-note {
    color: var(--color-surface-600);
    line-height: 1.6;
    font-size: 0.95rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
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

  .unlock .textarea {
    font-family: monospace;
    resize: vertical;
  }

  .error {
    color: var(--color-error-500);
    font-size: 0.9rem;
  }

  .textarea {
    width: 100%;
    resize: vertical;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .footer {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-surface-500);
    font-size: 0.9rem;
  }
</style>
