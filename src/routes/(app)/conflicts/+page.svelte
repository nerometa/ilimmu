<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { stageInput, resolveInput } from '#lib/contracts.ts';
  import type { ExportData } from '#lib/contracts.ts';
  import { request, loadState, messageFor, RequestError } from '#lib/client.ts';
  import Notice from '#lib/components/Notice.svelte';
  import ConflictCard from '#lib/components/ConflictCard.svelte';
  let { data } = $props();
  let pending = $state(false);
  let error = $state('');
  let success = $state('');
  let stale = $state(false);
  let refreshed = $state<ExportData>();
  let reviewed = $state(false);
  let inventoryId = $state('');
  let observedQuantity = $state(0);
  const account = $derived(refreshed ?? data.state);
  async function review() {
    pending = true;
    try { refreshed = await loadState(); reviewed = false; }
    catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
  async function mutate(path: string, body: unknown) {
    pending = true; error = ''; success = '';
    try { await request(path, 'POST', body); await invalidateAll(); refreshed = undefined; stale = false; success = 'Decision saved. Saved records are shown below.'; }
    catch (cause) { error = messageFor(cause); stale = cause instanceof RequestError && cause.code === 'STALE_REVISION'; refreshed = undefined; reviewed = false; }
    finally { pending = false; }
  }
  async function stage(event: SubmitEvent) {
    event.preventDefault();
    const item = account.inventory.find((item) => item.id === inventoryId);
    const parsed = stageInput.safeParse({ inventoryId, quantity: observedQuantity, revision: item?.revision, source: 'fixture-observation' });
    if (!parsed.success) { error = parsed.error.issues.map((issue) => issue.message).join(' '); return; }
    await mutate('/api/conflicts/stage', parsed.data);
  }
  async function resolve(conflict: ExportData['conflicts'][number], resolution: 'keep-manual' | 'accept-source') {
    const item = account.inventory.find((item) => item.id === conflict.inventoryId);
    const parsed = resolveInput.safeParse({ resolution, revision: conflict.revision, inventoryRevision: item?.revision });
    if (!parsed.success) { error = 'The inventory record is unavailable. Reload saved records.'; return; }
    await mutate(`/api/conflicts/${conflict.id}/resolve`, parsed.data);
  }
</script>

<svelte:head><title>Conflicts | Ilimmu</title></svelte:head>
<header class="page-heading"><p class="eyebrow">Data / Review observations</p><h1>Resolve with confidence</h1><p class="muted">Compare each observation with your current actual record. Manual values are preserved until you choose.</p></header>
<Notice message={error} {pending} {stale} pendingMessage="Updating saved records..." onreview={review} />
{#if success}<p class="alert" role="status">{success}</p>{/if}
{#if stale && refreshed}<div class="alert alert-warning"><p>The cards below now show current saved quantities and revisions. Your staged input is unchanged.</p><label class="checkbox-label"><input type="checkbox" bind:checked={reviewed} />I reviewed the refreshed values and want to make a decision.</label></div>{/if}
<div class="journal-stack">
  <section class="panel">
    <h2>Stage a fixture observation</h2><p class="muted">A local test observation, not a live import. Staging never changes the actual quantity.</p>
    {#if account.inventory.length === 0}<p><a href="/inventory">Add an inventory item</a> before staging.</p>
    {:else}<form onsubmit={stage}>
      <div class="form-grid"><label class="field"><span>Inventory item</span><select class="select" required bind:value={inventoryId}><option value="" disabled>Choose an item</option>{#each account.inventory as item (item.id)}<option value={item.id}>{item.name} / Actual {item.quantity} / Revision {item.revision}</option>{/each}</select></label><label class="field"><span>Observed absolute quantity</span><input class="input" type="number" min="0" max="2147483647" step="1" required bind:value={observedQuantity} /></label></div>
      <div class="form-actions"><button class="btn" disabled={pending || (stale && (!refreshed || !reviewed))}>Stage observation</button><small>Source: fixture-observation. Timestamp assigned when staged.</small></div>
    </form>{/if}
  </section>
  {#if account.conflicts.length === 0}<section class="empty"><h2>No conflicts to review</h2><p>Stage an observation above to exercise the explicit review workflow.</p></section>{/if}
  {#each account.conflicts as conflict (conflict.id)}
    {@const item = account.inventory.find((item) => item.id === conflict.inventoryId)}
    {@const observation = account.observations.find((item) => item.id === conflict.observationId)}
    {#if item && observation}<ConflictCard inventory={item} {observation} {conflict} {pending} disabled={stale && (!refreshed || !reviewed)} onresolve={(resolution) => resolve(conflict, resolution)} />{/if}
  {/each}
</div>
