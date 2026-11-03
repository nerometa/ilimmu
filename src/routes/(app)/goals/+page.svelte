<script lang="ts">
  import GoalForm from '#lib/components/GoalForm.svelte';
  import { timestamp } from '#lib/client.ts';
  let { data } = $props();
  let adding = $state(false);
  let editing = $state<string | null>(null);
</script>

<svelte:head><title>Goals | Ilimmu</title></svelte:head>
<header class="page-heading"><p class="eyebrow">Planning / Build targets</p><h1>Give your next build a direction</h1><p class="muted">Multiple saved targets, independent priorities, and an explicit finish. Your actual records stay untouched.</p><button class="btn btn-primary" onclick={() => adding = !adding}>{adding ? 'Close add form' : 'Add target'}</button></header>
<div class="journal-stack">
  {#if adding}<section class="panel"><h2>New target</h2>{#if data.state.characters.length + data.state.weapons.length === 0}<p>Add a <a href="/characters">character</a> or <a href="/weapons">weapon instance</a> first.</p>{:else}<GoalForm state={data.state} />{/if}</section>{/if}
  {#if data.state.goals.length === 0}<section class="empty"><h2>No targets yet</h2><p>Choose an owned character or weapon instance and save a named build target.</p></section>{/if}
  {#each data.state.goals as goal (goal.id)}
    {@const actual = data.state.characters.find((item) => item.id === goal.characterId) ?? data.state.weapons.find((item) => item.id === goal.weaponId)}
    <article class="panel">
      <div class="record-header"><div><span class="badge badge-target">{goal.priority}</span><h2 style="margin-top:12px">{goal.name}</h2><p class="muted">{actual?.name ?? 'Subject unavailable'}{goal.weaponId ? ` / Instance ${goal.weaponId}` : ''}</p></div><button class="btn" aria-expanded={editing === goal.id} onclick={() => editing = editing === goal.id ? null : goal.id}>{editing === goal.id ? 'Close editor' : 'Edit target'}</button></div>
      <div class="comparison">
        <div><h3>Actual</h3><p>Level {actual?.level ?? '-'} / Ascension {actual?.ascension ?? '-'}</p>{#if actual && 'talentAttack' in actual}<p>Talents {actual.talentAttack} / {actual.talentSkill} / {actual.talentBurst}</p>{/if}<small>Saved progression, not a plan</small></div>
        <div class="target"><h3>Target</h3><p>Level {goal.targetLevel} / Ascension {goal.targetAscension}</p><p>Talents {goal.targetAttack ?? '-'} / {goal.targetSkill ?? '-'} / {goal.targetBurst ?? '-'}</p><strong>{goal.completedAt ? `Completed ${timestamp(goal.completedAt)}` : 'Not completed'}</strong></div>
      </div>
      {#if goal.buildNotes}<p style="white-space:pre-wrap">{goal.buildNotes}</p>{/if}
      <p class="muted">Updated <time datetime={goal.updatedAt}>{timestamp(goal.updatedAt)}</time> / Revision {goal.revision}</p>
      {#if editing === goal.id}<GoalForm state={data.state} {goal} />{/if}
    </article>
  {/each}
</div>
