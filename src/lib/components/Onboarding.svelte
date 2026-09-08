<script lang="ts">
  import { generateMnemonic, normalizeMnemonic, secureEqual } from '../mnemonic'
  import ArchetypeSelector from './ArchetypeSelector.svelte'
  import type { ArchetypeId } from '../archetype'

  interface Props {
    onComplete: (result: { mnemonic: string; archetype: ArchetypeId }) => void
  }

  const { onComplete }: Props = $props()

  let step: 'intro' | 'display' | 'confirm' | 'archetype' = $state('intro')
  let mnemonic = $state('')
  let confirmInput = $state('')
  let copied = $state(false)
  let confirmError = $state(false)

  function generateKey() {
    mnemonic = generateMnemonic()
    step = 'display'
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(mnemonic)
    copied = true
    setTimeout(() => { copied = false }, 2000)
  }

  function proceedToConfirm() {
    step = 'confirm'
  }

  async function checkConfirmation() {
    const normalised = normalizeMnemonic(confirmInput)
    if (await secureEqual(normalised, mnemonic)) {
      confirmError = false
      step = 'archetype'
    } else {
      confirmError = true
    }
  }

  const wordCount = $derived(mnemonic ? mnemonic.split(' ').length : 0)
</script>

<div class="onboarding">
  {#if step === 'intro'}
    <section class="card surface">
      <h1 class="h2">Your identity, your key</h1>
      <p class="lead">
        The Platform uses a <strong>recovery key</strong> — a phrase of {wordCount || 12} words — as
        your identity. There are no emails, no passwords, no accounts.
      </p>
      <p class="lead">
        This key is the <em>only</em> way to recover your data. Write it down, store it safely,
        and never share it with anyone.
      </p>
      <button class="btn variant-filled-primary" onclick={generateKey}>
        Generate my recovery key
      </button>
    </section>

  {:else if step === 'display'}
    <section class="card surface">
      <h1 class="h2">Save your recovery key</h1>
      <p class="lead">
        Write these words down in order. Store them somewhere safe — offline if possible.
        This is the <strong>only</strong> way to access your data on a new device.
      </p>

      <div class="mnemonic-grid">
        {#each mnemonic.split(' ') as word, i}
          <span class="word-chip">
            <span class="word-index">{i + 1}</span>
            {word}
          </span>
        {/each}
      </div>

      <div class="actions">
        <button class="btn variant-soft" onclick={copyToClipboard}>
          {#if copied}Copied!{:else}Copy to clipboard{/if}
        </button>
        <button class="btn variant-filled-primary" onclick={proceedToConfirm}>
          I've saved it
        </button>
      </div>
    </section>

  {:else if step === 'confirm'}
    <section class="card surface">
      <h1 class="h2">Confirm your recovery key</h1>
      <p class="lead">
        To make sure you saved your key correctly, type it back below.
      </p>

      <textarea
        class="textarea"
        bind:value={confirmInput}
        placeholder="Type your recovery key here..."
        rows="4"
      ></textarea>

      {#if confirmError}
        <p class="error">The recovery key doesn't match. Please check and try again.</p>
      {/if}

      <div class="actions">
        <button class="btn variant-soft" onclick={() => { step = 'display'; confirmError = false }}>
          Back
        </button>
        <button class="btn variant-filled-primary" onclick={checkConfirmation}>
          Confirm
        </button>
      </div>
    </section>

  {:else if step === 'archetype'}
    <section class="card surface">
      <h1 class="h2">Choose your archetype</h1>
      <ArchetypeSelector onSelect={(id) => onComplete({ mnemonic, archetype: id })} />
    </section>
  {/if}
</div>

<style>
  .onboarding {
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
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

  .lead {
    line-height: 1.7;
    color: var(--color-surface-600);
  }

  .mnemonic-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    width: 100%;
    max-width: 480px;
  }

  .word-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-base);
    background: var(--color-surface-100);
    color: var(--color-surface-contrast-100);
    font-family: monospace;
    font-size: 0.9rem;
    border: 1px solid var(--color-surface-200);
  }

  .word-index {
    color: var(--color-surface-400);
    font-size: 0.75rem;
    min-width: 1.2em;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .textarea {
    width: 100%;
    font-family: monospace;
    resize: vertical;
  }

  .error {
    color: var(--color-error-500);
    font-size: 0.9rem;
  }
</style>
