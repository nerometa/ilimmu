<script lang="ts">
  import { timestamp } from '#lib/client.ts';
  import type { ExportData } from '#lib/contracts.ts';
  import Provenance from './Provenance.svelte';
  let { inventory, observation, conflict, pending = false, disabled = false, onresolve }: {
    inventory: ExportData['inventory'][number]; observation: ExportData['observations'][number];
    conflict: ExportData['conflicts'][number]; pending?: boolean; disabled?: boolean;
    onresolve: (resolution: 'keep-manual' | 'accept-source') => void;
  } = $props();
</script>

<article class="panel" aria-label={`Conflict for ${inventory.name}`}>
  <div class="record-header"><h2>{inventory.name}</h2><span class="badge badge-target">{conflict.resolution ? 'Resolved' : 'Needs your decision'}</span></div>
  <div class="comparison">
    <div><h3>Current actual</h3><p><strong>{inventory.quantity.toLocaleString()}</strong> total</p><Provenance {...inventory} /></div>
    <div class="target"><h3>Incoming observation</h3><p><strong>{observation.quantity.toLocaleString()}</strong> total</p><p>Source: {observation.source}</p><time datetime={observation.observedAt}>{timestamp(observation.observedAt)}</time></div>
  </div>
  <p class="muted">Conflict revision {conflict.revision} / Created {timestamp(conflict.createdAt)}</p>
  {#if conflict.resolution}<p role="status">{conflict.resolution === 'keep-manual' ? 'Kept the manual value' : 'Accepted the observation'}{conflict.resolvedAt ? ` / ${timestamp(conflict.resolvedAt)}` : ''}</p>
  {:else}
    <p>The observation has not changed your actual quantity. Choose explicitly.</p>
    <div class="cluster"><button class="btn" disabled={pending || disabled} onclick={() => onresolve('keep-manual')}>Keep manual value</button><button class="btn btn-primary" disabled={pending || disabled} onclick={() => onresolve('accept-source')}>Accept observation</button></div>
  {/if}
</article>
