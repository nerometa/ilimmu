<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { ExportData } from '#lib/contracts.ts';
  import { characterRecord } from '#lib/contracts.ts';
  import { request, messageFor } from '#lib/client.ts';
  let { record }:{record:ExportData['characters'][number]}=$props();
  let baseline=$state.raw($state.snapshot(untrack(()=>record)));
  let level=$state(untrack(()=>record.level)), ascension=$state(untrack(()=>record.ascension));
  let attack=$state(untrack(()=>record.talentAttack)),skill=$state(untrack(()=>record.talentSkill)),burst=$state(untrack(()=>record.talentBurst));
  let pending=$state(false),error=$state(''),status=$state('');
  const dirty=$derived(level!==baseline.level||ascension!==baseline.ascension||attack!==baseline.talentAttack||skill!==baseline.talentSkill||burst!==baseline.talentBurst);
  const outdated=$derived(record.revision>baseline.revision);
  function reset(){baseline=$state.snapshot(record);level=record.level;ascension=record.ascension;attack=record.talentAttack;skill=record.talentSkill;burst=record.talentBurst;error='';status='';}
  async function save(){
    pending=true;error='';status='';
    try{
      const response=await request(`/api/characters/${baseline.id}`,'PUT',{gameId:baseline.gameId,name:baseline.name,owned:baseline.owned,level,ascension,talentAttack:attack,talentSkill:skill,talentBurst:burst,revision:baseline.revision});
      baseline=characterRecord.parse(await response.json());
      await invalidateAll();status='Progression saved.';
    }catch(cause){error=messageFor(cause);}finally{pending=false;}
  }
</script>
<form onsubmit={e=>{e.preventDefault();save();}} aria-label="Character progression" aria-busy={pending}>
  <fieldset disabled={pending}>
    <h2>Character level</h2><div class="progression-fields"><label>Actual level<input class="input" type="number" min="1" max="90" required bind:value={level} /></label><label>Ascension<select class="select" bind:value={ascension}>{#each [0,1,2,3,4,5,6] as a (a)}<option value={a}>{a} / 6</option>{/each}</select></label></div>
    <h2>Talents</h2><p class="muted">Record base talent levels before constellation bonuses.</p><div class="progression-fields talents"><label>Normal attack<input class="input" type="number" min="1" max="15" required bind:value={attack} /></label><label>Elemental skill<input class="input" type="number" min="1" max="15" required bind:value={skill} /></label><label>Elemental burst<input class="input" type="number" min="1" max="15" required bind:value={burst} /></label></div>
    {#if outdated}<p class="muted" role="status">Newer progression is saved. Reset to load its values.</p>{/if}
    <div class="form-actions"><button class="btn btn-primary">{pending?'Saving…':'Save progression'}</button>{#if dirty||outdated}<button class="btn" type="button" onclick={reset}>Reset progression</button>{/if}<span role="status">{status}</span></div>
  </fieldset>
  {#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}
</form>
<style>
  fieldset{border:0;padding:0;min-width:0;}h2{margin:24px 0 12px;font-size:18px;}h2:first-child{margin-top:0;}.progression-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:560px;}.talents{grid-template-columns:repeat(3,minmax(0,1fr));max-width:760px;}label{display:grid;gap:8px;font-size:13px;color:var(--muted);}p{font-size:13px;}[role=status]{font-size:13px;color:var(--primary);}@media(max-width:460px){.talents{grid-template-columns:1fr;}}
</style>
