<script lang="ts">
  let { message = '', stale = false, pending = false, pendingMessage = 'Saving your changes...', showSessionRecovery = true, onreview }: {
    message?: string; stale?: boolean; pending?: boolean; pendingMessage?: string; showSessionRecovery?: boolean; onreview?: () => void;
  } = $props();
</script>

{#if pending}
  <p class="alert" role="status">{pendingMessage}</p>
{:else if message}
  <div class={['alert', stale ? 'alert-warning' : 'alert-error']} role="alert">
    <p>{message}</p>
    {#if stale}
      <p>Your draft is preserved. Reload saved records, compare them with your draft, then explicitly review before submitting again.</p>
      {#if onreview}<button type="button" class="btn" onclick={onreview}>Reload saved records for review</button>{/if}
    {/if}
    {#if showSessionRecovery}
      <p style="margin-top:12px"><a href="/login" target="_blank" rel="noopener">Open sign-in in a new tab</a> if your session has expired. Your draft stays in this tab.</p>
    {/if}
  </div>
{/if}
