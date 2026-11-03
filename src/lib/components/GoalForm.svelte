<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { goalInput, priorities } from '#lib/contracts.ts';
  import type { ExportData } from '#lib/contracts.ts';
  import { request, loadState, messageFor, RequestError, timestamp } from '#lib/client.ts';
  import Notice from './Notice.svelte';
  let { state: account, goal }: { state: ExportData; goal?: ExportData['goals'][number] } = $props();
  const id = $props.id();
  let pending = $state(false);
  let error = $state('');
  let success = $state('');
  let resetVersion = $state(0);
  let stale = $state(false);
  let reviewed = $state(false);
  let latest = $state<ExportData['goals'][number]>();
  let issues = $state<Record<string, string>>({});
  const talentFields = [
    { name: 'targetAttack', label: 'Target normal attack' },
    { name: 'targetSkill', label: 'Target elemental skill' },
    { name: 'targetBurst', label: 'Target elemental burst' }
  ] as const;
  async function review() {
    pending = true;
    try { latest = (await loadState()).goals.find((item) => item.id === goal?.id); reviewed = false; }
    catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const subject = String(fields.get('subject') ?? '');
    const [kind, subjectId] = subject.split(':');
    const parsed = goalInput.safeParse({
      name: fields.get('name'), characterId: kind === 'character' ? subjectId : null,
      weaponId: kind === 'weapon' ? subjectId : null, priority: fields.get('priority'),
      targetLevel: Number(fields.get('targetLevel')), targetAscension: Number(fields.get('targetAscension')),
      targetAttack: fields.get('targetAttack') ? Number(fields.get('targetAttack')) : null,
      targetSkill: fields.get('targetSkill') ? Number(fields.get('targetSkill')) : null,
      targetBurst: fields.get('targetBurst') ? Number(fields.get('targetBurst')) : null,
      buildNotes: fields.get('buildNotes'), completed: fields.has('completed')
    });
    error = ''; issues = {}; success = '';
    if (!parsed.success) {
      for (const issue of parsed.error.issues) issues[String(issue.path[0] ?? 'subject')] = issue.message;
      error = 'Check the highlighted fields.'; return;
    }
    pending = true;
    try {
      await request(`/api/goals${goal ? '/' + goal.id : ''}`, goal ? 'PUT' : 'POST',
        goal ? { ...parsed.data, revision: latest?.revision ?? goal.revision } : parsed.data);
      await invalidateAll(); stale = false; latest = undefined; success = 'Target saved. Actual progression was not changed.';
      if (!goal) resetVersion += 1;
    } catch (cause) { error = messageFor(cause); stale = cause instanceof RequestError && cause.code === 'STALE_REVISION'; latest = undefined; reviewed = false; }
    finally { pending = false; }
  }
</script>

{#key resetVersion}
<form onsubmit={save} aria-busy={pending} aria-label={goal ? `Edit target ${goal.name}` : 'Add target'}>
  <Notice message={error} {stale} {pending} onreview={review} />
  {#if success}<p class="alert" role="status">{success}</p>{/if}
  {#if latest}<div class="alert alert-warning"><strong>Latest saved target: {latest.name}</strong><p>Subject: {latest.characterId ? `Character ${latest.characterId}` : `Weapon instance ${latest.weaponId}`} / Revision {latest.revision}</p><p>Level {latest.targetLevel} / Ascension {latest.targetAscension} / Talents {latest.targetAttack ?? '-'} / {latest.targetSkill ?? '-'} / {latest.targetBurst ?? '-'} / {latest.priority} / {latest.completedAt ? 'Completed' : 'Not completed'} / Updated {timestamp(latest.updatedAt)}</p><p>{latest.buildNotes}</p><label class="checkbox-label"><input type="checkbox" bind:checked={reviewed} />I reviewed this target and want to save my draft.</label></div>{/if}
  <div class="form-grid">
    <label class="field" for={`${id}-name`}><span>Target name</span><input id={`${id}-name`} class="input" name="name" maxlength="100" required value={goal?.name ?? ''} aria-invalid={!!issues.name} aria-describedby={issues.name ? `${id}-name-error` : undefined} />{#if issues.name}<small id={`${id}-name-error`}>{issues.name}</small>{/if}</label>
    <label class="field" for={`${id}-subject`}><span>Character or weapon instance</span><select id={`${id}-subject`} class="select" name="subject" required value={goal?.characterId ? 'character:' + goal.characterId : goal?.weaponId ? 'weapon:' + goal.weaponId : ''} aria-invalid={!!issues.subject} aria-describedby={`${id}-subject-help`}>
      <option value="" disabled>Choose one subject</option>
      <optgroup label="Characters">{#each account.characters as character (character.id)}<option value={`character:${character.id}`}>{character.name} / Lv. {character.level}</option>{/each}</optgroup>
      <optgroup label="Weapon instances">{#each account.weapons as weapon (weapon.id)}<option value={`weapon:${weapon.id}`}>{weapon.name} / Lv. {weapon.level} / {weapon.id}</option>{/each}</optgroup>
    </select><small id={`${id}-subject-help`}>{issues.subject ?? 'You can save multiple independent targets for the same subject.'}</small></label>
    <label class="field"><span>Priority</span><select class="select" name="priority" value={goal?.priority ?? 'Actively Building'}>{#each priorities as priority (priority)}<option>{priority}</option>{/each}</select></label>
    <label class="field"><span>Target level</span><input class="input" name="targetLevel" type="number" min="1" max="90" step="1" required value={goal?.targetLevel ?? 90} /></label>
    <label class="field"><span>Target ascension</span><input class="input" name="targetAscension" type="number" min="0" max="6" step="1" required value={goal?.targetAscension ?? 6} /></label>
    {#each talentFields as field (field.name)}
      <label class="field" for={`${id}-${field.name}`}><span>{field.label} (optional)</span><input id={`${id}-${field.name}`} class="input" name={field.name} type="number" min="1" max="15" step="1" value={goal?.[field.name] ?? ''} aria-invalid={!!issues[field.name]} aria-describedby={issues[field.name] ? `${id}-${field.name}-error` : undefined} />{#if issues[field.name]}<small id={`${id}-${field.name}-error`}>{issues[field.name]}</small>{/if}</label>
    {/each}
  </div>
  <label class="field" style="margin-top:16px"><span>Build notes</span><textarea class="textarea" name="buildNotes" maxlength="2000" value={goal?.buildNotes ?? ''}></textarea></label>
  <label class="checkbox-label" style="margin-top:16px"><input type="checkbox" name="completed" checked={!!goal?.completedAt} />Mark this target completed</label>
  <div class="form-actions"><button class="btn btn-primary" disabled={pending || (stale && (!latest || !reviewed))}>{pending ? 'Saving...' : 'Save target'}</button><small>Targets never update actual records.</small></div>
</form>
{/key}
