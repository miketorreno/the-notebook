<script lang="ts">
  import { onMount } from 'svelte'

  let mode: 'light' | 'dark' = 'light'

  onMount(() => {
    const stored = localStorage.getItem('theme-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    mode = stored === 'dark' || (stored === null && prefersDark) ? 'dark' : 'light'
    applyMode(mode)
  })

  function toggleMode() {
    mode = mode === 'dark' ? 'light' : 'dark'
    applyMode(mode)
    localStorage.setItem('theme-mode', mode)
  }

  function applyMode(next: 'light' | 'dark') {
    document.documentElement.dataset.mode = next
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

  <main class="content">
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
      <p class="tags">
        <span class="chip variant-filled-surface">Local-first</span>
        <span class="chip variant-filled-surface">E2E encrypted</span>
        <span class="chip variant-filled-surface">No accounts</span>
      </p>
    </section>
  </main>

  <footer class="footer">
    <span>Ready for onboarding in the next slice.</span>
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
