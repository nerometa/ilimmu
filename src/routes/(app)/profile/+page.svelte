<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { profileInput } from '#lib/contracts.ts';
  import type { ExportData } from '#lib/contracts.ts';
  import { request, loadState, messageFor, RequestError, timestamp } from '#lib/client.ts';
  import Notice from '#lib/components/Notice.svelte';
  let { data } = $props();
  let pending = $state(false);
  let error = $state('');
  let success = $state('');
  let issues = $state<Record<string, string>>({});
  let stale = $state(false);
  let reviewed = $state(false);
  let latest = $state<ExportData['profile']>();
  async function review() {
    pending = true;
    try { latest = (await loadState()).profile; reviewed = false; }
    catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const fields = new FormData(event.currentTarget);
    const parsed = profileInput.safeParse({ name: fields.get('name'), uid: fields.get('uid'), server: fields.get('server'), revision: latest?.revision ?? data.state.profile.revision });
    issues = {}; error = ''; success = '';
    if (!parsed.success) { for (const issue of parsed.error.issues) issues[String(issue.path[0])] = issue.message; error = 'Check the highlighted fields.'; return; }
    pending = true;
    try { await request('/api/profile', 'PUT', parsed.data); await invalidateAll(); stale = false; latest = undefined; success = 'Profile saved.'; }
    catch (cause) { error = messageFor(cause); stale = cause instanceof RequestError && cause.code === 'STALE_REVISION'; latest = undefined; reviewed = false; }
    finally { pending = false; }
  }
</script>

<svelte:head><title>Profile | Ilimmu</title></svelte:head>
<header class="page-heading"><p class="eyebrow">Account / Profile</p><h1>Your traveler profile</h1><p class="muted">One account, an explicit server, and a clear record of your progress.</p></header>
<section class="panel">
  <h2>Game account</h2>
  <div class="provenance"><span class="badge">Manual entry</span><span>Source: manual</span><time datetime={data.state.profile.updatedAt}>{timestamp(data.state.profile.updatedAt)}</time><span>Revision {data.state.profile.revision}</span></div>
  <Notice message={error} {stale} {pending} onreview={review} />
  {#if latest}<div class="alert alert-warning"><p>Latest saved: {latest.name} / UID {latest.uid || 'not set'} / {latest.server} / revision {latest.revision} / {timestamp(latest.updatedAt)}</p><label class="checkbox-label"><input type="checkbox" bind:checked={reviewed} />I reviewed the latest profile and want to save my draft.</label></div>{/if}
  {#if success}<p class="alert" role="status">{success}</p>{/if}
  <form onsubmit={save}>
    <div class="form-grid">
      <label class="field"><span>Traveler name</span><input class="input" name="name" maxlength="100" required value={data.state.profile.name} aria-invalid={!!issues.name} aria-describedby={issues.name ? 'profile-name-error' : undefined} />{#if issues.name}<small id="profile-name-error">{issues.name}</small>{/if}</label>
      <label class="field"><span>Game UID (optional)</span><input class="input" name="uid" inputmode="numeric" pattern={'[0-9]{9,10}|^$'} maxlength="10" value={data.state.profile.uid} aria-invalid={!!issues.uid} aria-describedby="profile-uid-help" /><small id="profile-uid-help">{issues.uid ?? 'Enter 9 or 10 digits, or leave blank.'}</small></label>
      <label class="field"><span>Server</span><select class="select" name="server" value={data.state.profile.server}>{#each ['America', 'Europe', 'Asia', 'TW/HK/MO'] as server (server)}<option>{server}</option>{/each}</select></label>
    </div>
    <div class="form-actions"><button class="btn btn-primary" disabled={pending || (stale && (!latest || !reviewed))}>{pending ? 'Saving...' : 'Save profile'}</button><small>Server is never inferred from UID.</small></div>
  </form>
</section>
