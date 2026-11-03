<script lang="ts">
  import type { ExportData } from '#lib/contracts.ts';
  import RecordForm from './RecordForm.svelte';
  import Provenance from './Provenance.svelte';
  import TravelerPortrait from './TravelerPortrait.svelte';
  let { state: account, kind }: { state: ExportData; kind: 'characters' | 'weapons' | 'inventory' } = $props();
  let editing = $state<string | null>(null);
  let adding = $state(false);
  let search = $state('');
  const title = $derived(kind === 'characters' ? 'Characters' : kind === 'weapons' ? 'Weapons' : 'Inventory');
  const itemName = $derived(kind === 'characters' ? 'character' : kind === 'weapons' ? 'weapon instance' : 'inventory item');
  const rows = $derived(account[kind].filter((record) => `${record.name} ${record.gameId} ${record.id}`.toLowerCase().includes(search.toLowerCase())));
</script>

<svelte:head><title>{title} | Ilimmu</title></svelte:head>
<header class="page-heading">
  <p class="eyebrow">Account / Actual records</p><h1>{title}</h1>
  <p class="muted">{kind === 'characters' ? 'Your owned roster and current progression. A showcase is not a complete ownership record.' : kind === 'weapons' ? 'Each copy is a distinct instance, even when the game ID and name match.' : 'Materials and Mora, recorded as absolute totals. Saving a quantity replaces the total; it never adds a delta.'}</p>
  <button class="btn btn-primary" type="button" onclick={() => adding = !adding}>{adding ? 'Close add form' : `Add ${itemName}`}</button>
</header>
<div class="roster-toolbar">
  <label class="field"><span>Find {title.toLowerCase()}</span><input class="input" type="search" placeholder="Name, game ID, or instance ID" bind:value={search} /></label>
  <p class="roster-count"><strong>{account[kind].length}</strong> saved {kind === 'weapons' ? 'instances' : 'records'} / <strong>{account.goals.filter((goal) => kind === 'characters' ? goal.characterId !== null : kind === 'weapons' ? goal.weaponId !== null : false).length}</strong> build targets</p>
</div>
<div class="journal-stack">
  {#if adding}<section class="panel"><h2>Add {itemName}</h2><RecordForm {kind} /></section>{/if}
  {#if rows.length === 0}<section class="empty"><h2>{account[kind].length ? 'No matching records' : `No ${title.toLowerCase()} yet`}</h2><p>{account[kind].length ? 'Try a different name or game ID.' : `Add your first ${itemName} manually. No external importer is connected.`}</p></section>{/if}
  <div class="record-list">
    {#each rows as record (record.id)}
      <article class="panel record-card">
        <div class="record-header"><div class="record-identity">
          {#if kind === 'characters'}<div class="portrait"><TravelerPortrait seed={record.gameId} /></div>{/if}
          <div><h2>{record.name}</h2><small>Game ID {record.gameId}</small></div>
        </div><button class="btn" type="button" aria-expanded={editing === record.id} onclick={() => editing = editing === record.id ? null : record.id}>{editing === record.id ? 'Close editor' : `Edit ${record.name}`}</button></div>
        {#if kind === 'weapons'}<p class="muted" style="font-size:12px;margin-top:12px">Instance {record.id}</p>{/if}
        <Provenance {...record} />
        <dl class="record-summary">
          {#if 'quantity' in record}<div><dt>Actual quantity</dt><dd>{record.quantity.toLocaleString()}</dd></div>{/if}
          {#if 'level' in record}<div><dt>Actual level</dt><dd>{record.level} / 90</dd></div><div><dt>Ascension</dt><dd>{record.ascension} / 6</dd></div>{/if}
          {#if 'talentAttack' in record}<div><dt>Attack / Skill / Burst</dt><dd>{record.talentAttack} / {record.talentSkill} / {record.talentBurst}</dd></div>{/if}
          {#if 'refinement' in record}<div><dt>Refinement</dt><dd>R{record.refinement}</dd></div>{/if}
        </dl>
        {#each account.goals.filter((goal) => goal.characterId === record.id || goal.weaponId === record.id) as goal (goal.id)}
          <div class="section-rule">
            <p class="goal-line"><span class="badge badge-target">Target</span> <a href="/goals">{goal.name}</a><span>{goal.priority}{goal.completedAt ? ' / Completed' : ''}</span></p>
            {#if 'level' in record}
              <div class="progress-label"><span>Level <strong>{record.level}</strong> actual</span><span><strong>{goal.targetLevel}</strong> target / Asc. {goal.targetAscension}</span></div>
              <progress class="progress-track" value={Math.min(record.level, goal.targetLevel)} max={goal.targetLevel} aria-label={`Actual level ${record.level}, target level ${goal.targetLevel}`}></progress>
            {/if}
          </div>
        {/each}
        {#if editing === record.id}<RecordForm {kind} {record} />{/if}
      </article>
    {/each}
  </div>
</div>
