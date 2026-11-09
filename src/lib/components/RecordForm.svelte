<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { characterInput, weaponInput, inventoryInput } from '#lib/contracts.ts';
  import type { ExportData } from '#lib/contracts.ts';
  import { request, loadState, messageFor, RequestError } from '#lib/client.ts';
  import Notice from './Notice.svelte';
  import Provenance from './Provenance.svelte';
  let { kind, record, onsaved }: {
    kind: 'characters' | 'weapons' | 'inventory';
    record?: ExportData['characters'][number] | ExportData['weapons'][number] | ExportData['inventory'][number];
    onsaved?: () => void;
  } = $props();
  let pending = $state(false);
  let error = $state('');
  let issues = $state<Record<string, string>>({});
  let stale = $state(false);
  let reviewed = $state(false);
  let latest = $state<typeof record>();
  let success = $state('');
  let resetVersion = $state(0);
  const id = $props.id();
  const fields = $derived(kind === 'inventory'
    ? [{ name: 'quantity', label: 'Actual quantity (absolute total)', min: 0, max: 2147483647, value: 0 }]
    : [
      { name: 'level', label: 'Actual level', min: 1, max: 90, value: 1 },
      { name: 'ascension', label: 'Actual ascension', min: 0, max: 6, value: 0 },
      ...(kind === 'characters' ? [
        { name: 'talentAttack', label: 'Normal attack talent', min: 1, max: 15, value: 1 },
        { name: 'talentSkill', label: 'Elemental skill talent', min: 1, max: 15, value: 1 },
        { name: 'talentBurst', label: 'Elemental burst talent', min: 1, max: 15, value: 1 }
      ] : [{ name: 'refinement', label: 'Refinement rank', min: 1, max: 5, value: 1 }])
    ]);
  function valueFor(name: string, fallback: number) {
    if (record && name in record) {
      const value = Reflect.get(record, name);
      if (typeof value === 'number') return value;
    }
    return fallback;
  }
  async function review() {
    pending = true;
    try {
      const state = await loadState();
      latest = state[kind].find((item) => item.id === record?.id);
      reviewed = false;
      if (!latest) error = 'The saved record is no longer available. Your draft is preserved.';
    } catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
  async function save(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    pending = true; error = ''; issues = {}; success = '';
    const data = new FormData(form);
    const input: Record<string, unknown> = { ...(kind === 'characters' ? { owned: record && 'owned' in record ? record.owned : true } : {}), name: data.get('name'), gameId: Number(data.get('gameId')) };
    for (const field of fields) input[field.name] = Number(data.get(field.name));
    const schema = kind === 'characters' ? characterInput : kind === 'weapons' ? weaponInput : inventoryInput;
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) issues[String(issue.path[0])] = issue.message;
      error = 'Check the highlighted fields.'; pending = false; return;
    }
    try {
      await request(`/api/${kind}${record ? '/' + record.id : ''}`, record ? 'PUT' : 'POST',
        record ? { ...parsed.data, revision: latest?.revision ?? record.revision } : parsed.data);
      stale = false; latest = undefined; reviewed = false;
      success = 'Actual record saved.';
      await invalidateAll();
      if (!record) resetVersion += 1;
      onsaved?.();
    } catch (cause) {
      error = messageFor(cause);
      stale = cause instanceof RequestError && cause.code === 'STALE_REVISION';
      latest = undefined; reviewed = false;
    } finally { pending = false; }
  }
</script>

{#key resetVersion}
<form onsubmit={save} aria-busy={pending} aria-label={record ? `Edit ${record.name}` : `Add ${kind === 'inventory' ? 'inventory item' : kind === 'characters' ? 'character' : 'weapon instance'}`}>
  <Notice message={error} {stale} {pending} onreview={review} />
  {#if latest}
    <section class="alert alert-warning" aria-label="Latest saved record">
      <strong>Latest saved values</strong>
      <p>{latest.name} / Game ID {latest.gameId}</p>
      <dl class="record-summary">{#each fields as field (field.name)}<div><dt>{field.label}</dt><dd>{String(Reflect.get(latest, field.name))}</dd></div>{/each}</dl>
      <Provenance {...latest} />
      <label class="checkbox-label"><input type="checkbox" bind:checked={reviewed} />I reviewed the latest saved values and want to save my draft.</label>
    </section>
  {/if}
  {#if success}<p role="status" class="alert">{success}</p>{/if}
  <div class="form-grid">
    <label class="field" for={`${id}-name`}><span>Name</span><input id={`${id}-name`} class="input" name="name" required maxlength="100" value={record?.name ?? ''} aria-invalid={!!issues.name} aria-describedby={issues.name ? `${id}-name-error` : undefined} />{#if issues.name}<small id={`${id}-name-error`}>{issues.name}</small>{/if}</label>
    <label class="field" for={`${id}-gameId`}><span>Game ID</span><input id={`${id}-gameId`} class="input" name="gameId" type="number" min="1" max="2147483647" step="1" required value={record?.gameId} aria-invalid={!!issues.gameId} aria-describedby={issues.gameId ? `${id}-gameId-error` : undefined} />{#if issues.gameId}<small id={`${id}-gameId-error`}>{issues.gameId}</small>{/if}</label>
    {#each fields as field (field.name)}
      <label class="field" for={`${id}-${field.name}`}>
        <span>{field.label}</span>
        <input id={`${id}-${field.name}`} class="input" name={field.name} type="number" min={field.min} max={field.max} step="1" required value={valueFor(field.name, field.value)} aria-invalid={!!issues[field.name]} aria-describedby={issues[field.name] ? `${id}-${field.name}-error` : undefined} />
        {#if issues[field.name]}<small id={`${id}-${field.name}-error`}>{issues[field.name]}</small>{/if}
      </label>
    {/each}
  </div>
  <div class="form-actions"><button class="btn btn-primary" disabled={pending || (stale && (!latest || !reviewed))}>{pending ? 'Saving...' : record ? 'Save actual record' : 'Add actual record'}</button><small>Manual entry. Targets are edited separately in Goals.</small></div>
</form>
{/key}
