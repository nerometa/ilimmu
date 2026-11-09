<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { ExportData } from '#lib/contracts.ts';
  import { buildValues, buildInput, buildRecord, catalog, mainStats, type Build } from '#lib/game/builds.ts';
  import { request, messageFor } from '#lib/client.ts';
  import EquipmentPicker from './EquipmentPicker.svelte';
  import GameImage from './GameImage.svelte';
  let { gameId, weaponType, saved, progression = false }: { gameId:number; weaponType:string; saved?:ExportData['builds'][number]; progression?:boolean }=$props();
  let baseline=$state.raw($state.snapshot(untrack(()=>saved)));
  let draft=$state<Build>(structuredClone(buildValues(untrack(()=>baseline))));
  let pending=$state(false), error=$state(''), status=$state('');
  const dirty=$derived(JSON.stringify(buildValues(draft))!==JSON.stringify(buildValues(baseline)));
  const outdated=$derived((saved?.revision??-1)>(baseline?.revision??-1));
  const setId=$derived(draft.artifacts.mode==='4pc'?draft.artifacts.setId:null);
  const set=$derived(catalog.artifacts.find(a=>a.id===setId));
  function reset(){baseline=$state.snapshot(saved);draft=structuredClone(buildValues(baseline));error='';status='';}
  async function save(){
    pending=true;error='';status='';
    const parsed=buildInput.safeParse(draft);
    if(!parsed.success){error=parsed.error.issues[0]?.message??'Review your build.';pending=false;return;}
    try{
      const response=await request(`/api/roster/${gameId}/build`,'PUT',{...parsed.data,revision:baseline?.revision??null});
      baseline=buildRecord.parse(await response.json());
      draft=structuredClone(buildValues(baseline));
      await invalidateAll();status='Build saved.';
    }catch(cause){error=messageFor(cause);}finally{pending=false;}
  }
</script>
<form class="build-form" onsubmit={(event)=>{event.preventDefault();save();}} aria-label="Character build" aria-busy={pending}>
  <fieldset disabled={pending}>
    <div class="build-fields">
      <div class="equipment-field"><span>Weapon</span><EquipmentPicker kind="weapon" {weaponType} weaponId={draft.weaponId} artifacts={draft.artifacts} onweapon={value=>{draft.weaponId=value;status='';}} onartifacts={value=>draft.artifacts=value} /></div>
      <div class="equipment-field"><span>Artifacts <small>{draft.artifacts.mode==='4pc'?'4pc':'2+2'}</small></span><EquipmentPicker kind="artifacts" {weaponType} weaponId={draft.weaponId} artifacts={draft.artifacts} onweapon={value=>draft.weaponId=value} onartifacts={value=>{draft.artifacts=value;status='';}} /></div>
      {#each (['sands','goblet','circlet'] as const) as slot (slot)}
        {@const key = slot as keyof typeof mainStats}
        <label class="stat-field"><span><GameImage kind="slot" id={slot} size={20} />{slot.charAt(0).toUpperCase()+slot.slice(1)}</span><select aria-label={`${slot.charAt(0).toUpperCase()+slot.slice(1)} main stat`} bind:value={draft[key]} onchange={()=>status=''}><option value={null}>Choose main stat</option>{#each mainStats[key] as stat (stat)}<option value={stat}>{stat}</option>{/each}</select></label>
      {/each}
    </div>
    {#if draft.artifacts.mode==='2pc+2pc'}<p class="set-effects">2pc · {draft.artifacts.effect1??'Choose effect'} <span>+</span> 2pc · {draft.artifacts.effect2??'Choose effect'}</p>{/if}
    {#if progression}
      <div class="weapon-progression"><label>Weapon level<input class="input" type="number" min="1" max="90" bind:value={draft.weaponLevel} /></label><label>Weapon ascension<select class="select" bind:value={draft.weaponAscension}>{#each [0,1,2,3,4,5,6] as asc (asc)}<option value={asc}>{asc}</option>{/each}</select></label><label>Refinement<select class="select" bind:value={draft.refinement}>{#each [1,2,3,4,5] as refinement (refinement)}<option value={refinement}>R{refinement}</option>{/each}</select></label></div>
      {#if set}<details class="set-details"><summary>{set.name} bonuses</summary><p><strong>2 pieces</strong> · {set.effect2}</p><p><strong>4 pieces</strong> · {set.effect4}</p></details>{/if}
    {/if}
    {#if outdated}<p class="build-status" role="status">A newer build is saved. Reset to load its values.</p>{/if}
    {#if dirty||outdated}<div class="build-actions"><small>{dirty?'Unsaved changes':'Saved build changed'}</small><button class="btn" type="button" onclick={reset}>Reset</button><button class="btn btn-primary" type="submit" disabled={!dirty}>{pending?'Saving…':'Save build'}</button></div>{/if}
  </fieldset>
  <div aria-live="polite">{#if status}<p class="build-status">{status}</p>{/if}</div>
  {#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}
</form>
<style>
  .build-form{container-type:inline-size;container-name:build;min-width:0;}
  fieldset{border:0;padding:0;margin:0;min-width:0;}.build-fields{display:grid;grid-template-columns:76px 92px repeat(3,minmax(0,1fr));gap:12px;align-items:start;}
  .equipment-field,.stat-field{display:grid;gap:6px;min-width:0;}.equipment-field>span,.stat-field>span{font-size:12px;font-weight:600;color:var(--muted);display:flex;gap:6px;align-items:center;min-height:20px;}.equipment-field small{font-weight:400;font-size:10px;margin-left:auto;white-space:nowrap;}
  .stat-field select{width:100%;height:44px;min-width:0;border:1px solid var(--border);background:var(--canvas);color:var(--ink);border-radius:8px;padding:0 8px;font-size:13px;cursor:pointer;}
  .build-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;margin-top:12px;}.build-actions small{margin-right:auto;font-size:12px;}.build-actions .btn{font-size:12px;padding:6px 12px;min-height:44px;}.build-status{font-size:12px;color:var(--primary);margin:8px 0 0;}.set-effects{font-size:12px;color:var(--muted);margin:10px 0 0;}.set-effects span{margin:0 8px;}
  .weapon-progression{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:24px;}.weapon-progression label{display:grid;gap:8px;font-size:13px;color:var(--muted);}.set-details{margin-top:24px;font-size:13px;color:var(--muted);}.set-details summary{cursor:pointer;color:var(--ink);min-height:44px;padding:12px 0;}.set-details p{margin-bottom:8px;}
  @container build (max-width:620px){.build-fields{grid-template-columns:repeat(6,minmax(0,1fr));}.equipment-field{grid-column:span 3;}.stat-field{grid-column:span 2;}}
  @container build (max-width:420px){.build-fields{gap:12px 8px;}.equipment-field{grid-column:span 3;}.stat-field{grid-column:1 / -1;grid-template-columns:84px minmax(0,1fr);align-items:center;gap:8px;}.stat-field select{font-size:13px;padding:0 8px;}.weapon-progression{grid-template-columns:1fr;}}
</style>
