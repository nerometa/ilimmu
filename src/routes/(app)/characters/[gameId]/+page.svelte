<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { characterRecordFor, characterBuildFor } from '#lib/game/roster.ts';
  import { request, messageFor } from '#lib/client.ts';
  import GameImage from '#lib/components/GameImage.svelte';
  import CharacterBuild from '#lib/components/CharacterBuild.svelte';
  import CharacterProgression from '#lib/components/CharacterProgression.svelte';
  import GoalForm from '#lib/components/GoalForm.svelte';
  import Provenance from '#lib/components/Provenance.svelte';
  let { data }=$props();
  let tab=$state('progression'),pending=$state(false),error=$state(''),newTarget=$state(false);
  const c=$derived(data.character);
  const record=$derived(characterRecordFor(data.state.characters,c.id));
  const build=$derived(characterBuildFor(data.state.builds,c.id));
  const targets=$derived(data.state.goals.filter(g=>g.characterId===record?.id));
  async function own(){pending=true;try{await request(`/api/roster/${record?.gameId??c.id}/ownership`,'PUT',{owned:!record?.owned,revision:record?.revision??null});await invalidateAll();}catch(cause){error=messageFor(cause);}finally{pending=false;}}
</script>
<svelte:head><title>{c.name} | Ilimmu</title></svelte:head>
<a class="back-link" href="/characters"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h16" /></svg> Characters</a>
<header class="profile-heading"><GameImage kind="characters" id={c.id} size={80} rarity={c.rarity} /><div><h1>{c.name}</h1><p>{c.element} · {c.weaponType} · {c.rarity}-star{c.region?` · ${c.region}`:''}</p></div><button class="btn" type="button" onclick={own} disabled={pending}>{pending?'Saving…':record?.owned?'Mark not owned':'Mark owned'}</button></header>
{#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}
<nav class="profile-tabs" aria-label="Character sections">{#each ([['progression','Level & talents'],['build','Weapon & artifacts'],['targets','Progression targets']] as const) as [id,label] (id)}<button type="button" aria-current={tab===id?'page':undefined} onclick={()=>tab=id}>{label}</button>{/each}</nav>
<section class="profile-content">
  {#if tab==='progression'}
    {#if record}{#key record.id}<CharacterProgression {record} />{/key}<div class="profile-provenance"><Provenance {...record} /></div>{:else}<h2>Track {c.name}’s progression</h2><p class="muted">Mark this character owned to record their level and talents. You can plan equipment before owning them.</p><button class="btn btn-primary" type="button" onclick={own} disabled={pending}>Mark owned</button>{/if}
  {:else if tab==='build'}<h2>Weapon & artifacts</h2><p class="muted">One saved build, available on your roster.</p>{#key c.id}<CharacterBuild gameId={build?.gameId??c.id} weaponType={c.weaponType} saved={build} progression />{/key}
  {:else}<h2>Progression targets</h2><p class="muted">Targets are plans. Editing them does not change your actual progression.</p>{#if record}{#each targets as goal (goal.id)}<details class="target-details"><summary>{goal.name} · Level {goal.targetLevel}</summary><GoalForm state={data.state} {goal} /></details>{/each}<button class="btn" type="button" onclick={()=>newTarget=!newTarget}>{newTarget?'Close target editor':'New progression target'}</button>{#if newTarget}<GoalForm state={{...data.state,characters:[record],weapons:[]}} />{/if}{:else}<p>Mark this character owned to attach progression targets.</p>{/if}
  {/if}
</section>
<style>
  .back-link{display:inline-flex;align-items:center;gap:8px;margin-bottom:24px;font-size:13px;text-decoration:none;}.profile-heading{display:flex;gap:20px;align-items:center;margin-bottom:28px;}.profile-heading>div{flex:1;}.profile-heading h1{font-family:inherit;font-size:30px;font-weight:700;margin-bottom:8px;}.profile-heading p{font-size:13px;color:var(--muted);margin:0;}.profile-tabs{display:flex;gap:8px;border-bottom:1px solid var(--border);margin-bottom:28px;overflow-x:auto;}.profile-tabs button{flex:none;min-height:48px;padding:12px 16px;background:transparent;border:0;border-bottom:2px solid transparent;color:var(--muted);font-size:13px;cursor:pointer;}.profile-tabs button[aria-current=page]{color:var(--primary);border-bottom-color:var(--primary);}.profile-content{padding:24px;background:var(--surface);border-radius:12px;}.profile-content>p{font-size:14px;}.profile-provenance{margin-top:24px;border-top:1px solid var(--border);padding-top:8px;}.target-details{border-bottom:1px solid var(--border);padding:16px 0;margin-bottom:16px;}.target-details summary{min-height:44px;cursor:pointer;}
  @media(max-width:600px){.profile-heading{gap:12px;flex-wrap:wrap;}.profile-heading h1{font-size:24px;}.profile-heading .btn{width:100%;}.profile-content{padding:16px;}.profile-tabs button{padding:10px;font-size:12px;}}
</style>
