<script lang="ts">
  import { timestamp } from '#lib/client.ts';
  let { source, manualOverride, updatedAt, revision }: {
    source: string; manualOverride: boolean; updatedAt: string; revision: number;
  } = $props();
</script>

<div class="provenance">
  <span class="badge">{manualOverride ? 'Manual correction' : source === 'manual' ? 'Manual entry' : 'Observation'}</span>
  <span>Source: {source}</span>
  <time datetime={updatedAt}>{timestamp(updatedAt)}</time>
  <span>Revision {revision}</span>
</div>
