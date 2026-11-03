<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { exportSchema } from '#lib/contracts.ts';
  import { request, messageFor, timestamp } from '#lib/client.ts';
  import Notice from '#lib/components/Notice.svelte';
  let { data } = $props();
  let pending = $state(false);
  let error = $state('');
  let ready = $state('');
  const lastGenerated = $derived(data.state.profile.lastExportGeneratedAt);
  const overdue = $derived(!lastGenerated || new Date(data.state.generatedAt).getTime() - new Date(lastGenerated).getTime() >= 7 * 24 * 60 * 60 * 1000);
  async function download() {
    pending = true; error = ''; ready = '';
    try {
      const exported = exportSchema.parse(await (await request('/api/exports')).json());
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = `ilimmu-v1-${exported.generatedAt.slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      // The click has handed the blob to the download subsystem before this task completes.
      setTimeout(() => URL.revokeObjectURL(url), 0);
      ready = `Export generated ${timestamp(exported.generatedAt)}. Download requested; confirm the file in your browser downloads.`;
      await invalidateAll();
    } catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
</script>

<svelte:head><title>Export | Ilimmu</title></svelte:head>
<header class="page-heading"><p class="eyebrow">Data / Personal export</p><h1>Your progress belongs to you</h1><p class="muted">Generate a versioned copy of your personal game records and plans.</p></header>
<section class="panel">
  <h2>Personal-data download</h2>
  <p>Includes your profile, characters, weapon instances, inventory, targets, observations, and conflicts. Excludes authentication records and secrets.</p>
  <dl class="record-summary"><div><dt>Format</dt><dd>Ilimmu JSON / v1</dd></div><div><dt>Last export generated</dt><dd>{lastGenerated ? timestamp(lastGenerated) : 'Not generated yet'}</dd></div></dl>
  {#if overdue}<p class="alert alert-warning">Seven-day reminder: generate a fresh export and keep a copy somewhere safe.</p>{/if}
  <Notice message={error} {pending} pendingMessage="Generating your export..." />
  {#if ready}<p class="alert" role="status">{ready}</p>{/if}
  <button class="btn btn-primary" disabled={pending} onclick={download}>{pending ? 'Generating export...' : 'Generate and download JSON'}</button>
  <p class="muted" style="margin-top:16px">This timestamp records generation, not proof that a file was saved. This personal-data export is not an operator database backup.</p>
</section>
