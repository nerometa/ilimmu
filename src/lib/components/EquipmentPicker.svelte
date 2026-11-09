<script lang="ts">
  import { catalog, effects, canonicalEffect, setsForEffect, type Build } from '#lib/game/builds.ts';
  import GameImage from './GameImage.svelte';
  import EquipmentTile from './EquipmentTile.svelte';
  import FilterOptions from './FilterOptions.svelte';
  import { matchesGameFilters } from '#lib/game/filters.ts';
  let { kind, weaponType, weaponId, artifacts, onweapon, onartifacts }: {
    kind:'weapon'|'artifacts'; weaponType:string; weaponId:number|null; artifacts:Build['artifacts'];
    onweapon:(id:number|null)=>void; onartifacts:(value:Build['artifacts'])=>void;
  }=$props();
  let dialog:HTMLDialogElement;
  let search=$state('');
  let rarities=$state<number[]>([]);
  let mode=$state<'4pc'|'2pc+2pc'>('4pc');
  let effect1=$state<string|null>(null);
  let effect2=$state<string|null>(null);
  let effectSlot=$state<1|2>(1);
  const weapon=$derived(catalog.weapons.find(w=>w.id===weaponId));
  const set=$derived(artifacts.mode==='4pc'?catalog.artifacts.find(a=>a.id===artifacts.setId):undefined);
  const label=$derived(kind==='weapon'?weapon?.name??'Choose weapon':artifacts.mode==='4pc'?set?.name??'Choose artifacts':'2pc + 2pc');
  const weapons=$derived(catalog.weapons.filter(w=>w.weaponType===weaponType && matchesGameFilters(w,{search,rarities})));
  const sets=$derived(catalog.artifacts.filter(a=>a.effect4 && `${a.name} ${a.effect2} ${a.effect4}`.toLowerCase().includes(search.toLowerCase())));
  const filteredEffects=$derived(effects.filter(e=>`${e} ${setsForEffect(e).map(a=>a.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())));
  const validPair=$derived(effect1 && effect2 && (effect1!==effect2 || setsForEffect(effect1).length>=2));
  const pairSets=$derived.by(()=>{
    if(artifacts.mode!=='2pc+2pc')return [];
    const first=catalog.artifacts.find(a=>canonicalEffect(a.effect2)===artifacts.effect1);
    const second=catalog.artifacts.find(a=>canonicalEffect(a.effect2)===artifacts.effect2&&a.id!==first?.id);
    return [first,second].filter((a):a is NonNullable<typeof a>=>!!a);
  });
  const pairItem=$derived(artifacts.mode==='2pc+2pc'&&pairSets[0]?{...pairSets[0],name:'2 pieces + 2 pieces',effect2:`${artifacts.effect1??''} + ${artifacts.effect2??''}`,effect4:''}:undefined);
  function open(){search='';rarities=[];mode=artifacts.mode;if(artifacts.mode==='2pc+2pc'){effect1=artifacts.effect1;effect2=artifacts.effect2;}else{effect1=null;effect2=null;}effectSlot=1;dialog.showModal();dialog.querySelector('input')?.focus();}
  function chooseEffect(value:string){if(effectSlot===1){effect1=value;effectSlot=2;}else effect2=value;}
</script>
<EquipmentTile kind={kind==='weapon'?'weapons':'artifacts'} item={kind==='weapon'?weapon:set??pairItem} label={`Choose ${kind==='weapon'?'weapon':'artifacts'}: ${label}`} onclick={open}>
  {#if artifacts.mode==='2pc+2pc'&&kind==='artifacts'&&pairSets.length}
    <span class="selected-pair">{#each pairSets as a (a.id)}<GameImage kind="artifacts" id={a.id} rarity={a.rarity} size={48} />{/each}</span>
  {:else if kind==='weapon'&&weapon}<GameImage kind="weapons" id={weapon.id} rarity={weapon.rarity} size={64} />
  {:else if set}<GameImage kind="artifacts" id={set.id} rarity={set.rarity} size={64} />
  {:else}<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="empty-label">{kind==='weapon'?'Weapon':'Artifacts'}</span>{/if}
</EquipmentTile>
<dialog bind:this={dialog} class="equipment-dialog" aria-label={kind==='weapon'?'Choose weapon':'Choose artifacts'}>
  <div class="picker-header"><h2>{kind==='weapon'?'Choose weapon':'Choose artifacts'}</h2><button type="button" class="btn" onclick={()=>dialog.close()} aria-label="Close picker">Close</button></div>
  {#if kind==='artifacts'}
    <div class="picker-modes" aria-label="Artifact combination">
      <button type="button" aria-pressed={mode==='4pc'} onclick={()=>{mode='4pc';search='';}}>4 pieces</button>
      <button type="button" aria-pressed={mode==='2pc+2pc'} onclick={()=>{mode='2pc+2pc';search='';}}>2 pieces + 2 pieces</button>
    </div>
  {/if}
  <label class="picker-search"><span class="sr-only">Search {kind==='weapon'?'weapons':'artifacts and effects'}</span><input class="input" type="search" placeholder={kind==='weapon'?'Search weapons or secondary stats…':'Search sets or effects…'} bind:value={search} /></label>
  {#if kind==='weapon'}<div class="weapon-filters"><FilterOptions showElements={false} showWeapons={false} rarityChoices={[5,4,3,2,1]} bind:rarities /><p role="status">{weapons.length} {weaponType.toLowerCase()} weapons</p></div>{/if}
  {#if kind==='artifacts' && mode==='2pc+2pc'}
    <div class="effect-selection">
      <button type="button" aria-pressed={effectSlot===1} onclick={()=>effectSlot=1}>{effect1??'Choose first effect'}</button><span>+</span>
      <button type="button" aria-pressed={effectSlot===2} onclick={()=>effectSlot=2}>{effect2??'Choose second effect'}</button>
    </div>
  {/if}
  <div class="picker-results">
    {#if kind==='weapon'}
      <button class="clear-choice" type="button" onclick={()=>{onweapon(null);dialog.close();}}>No weapon selected</button>
      <div class="equipment-grid">{#each weapons as w (w.id)}<EquipmentTile kind="weapons" item={w} showInfo label={w.name} onclick={()=>{onweapon(w.id);dialog.close();}} />{/each}</div>
      {#if !weapons.length}<p class="muted">No weapons match. Try another name or rarity.</p><button class="clear-choice" type="button" onclick={()=>{search='';rarities=[];}}>Clear weapon filters</button>{/if}
    {:else if mode==='4pc'}
      <button class="clear-choice" type="button" onclick={()=>{onartifacts({mode:'4pc',setId:null});dialog.close();}}>No artifact set selected</button>
      <div class="equipment-grid">{#each sets as a (a.id)}<EquipmentTile kind="artifacts" item={a} showInfo label={a.name} onclick={()=>{onartifacts({mode:'4pc',setId:a.id});dialog.close();}} />{/each}</div>
      {#if !sets.length}<p class="muted">No sets match. Try another name or effect.</p>{/if}
    {:else}
      <p class="picker-help">Choose the bonuses you want. Each bonus comes from two pieces of a matching set.</p>
      {#each filteredEffects as effect (effect)}
        <button type="button" class="effect-choice" aria-pressed={(effectSlot===1?effect1:effect2)===effect} onclick={()=>chooseEffect(effect)}>
          <strong>{effect}</strong><span class="effect-sets">{#each setsForEffect(effect) as a (a.id)}<span title={a.name} class="stacked-artifact"><GameImage kind="artifacts" id={a.id} rarity={a.rarity} size={32} /><span class="sr-only">{a.name}</span></span>{/each}</span>
        </button>
      {/each}
      {#if !filteredEffects.length}<p class="muted">No effects match your search.</p>{/if}
    {/if}
  </div>
  {#if kind==='artifacts' && mode==='2pc+2pc'}<footer class="picker-footer"><small>{effect1===effect2&&effect1&&!validPair?'This effect is available from only one set. Choose another effect.':'Two different sets activate both bonuses.'}</small><button class="btn btn-primary" type="button" disabled={!validPair} onclick={()=>{onartifacts({mode:'2pc+2pc',effect1,effect2});dialog.close();}}>Use these effects</button></footer>{/if}
</dialog>
<style>
  .equipment-dialog{margin:auto;width:min(760px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:1px solid var(--border);border-radius:16px;background:var(--surface);color:var(--ink);overflow:hidden;}
  .equipment-dialog[open]{display:flex;flex-direction:column;} .equipment-dialog::backdrop{background:#060910b3;}
  .picker-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;gap:16px;}h2{margin:0;font-size:20px;}
  .picker-modes{display:flex;margin:0 20px 12px;padding:4px;background:var(--canvas);border-radius:8px;}
  .picker-modes button,.effect-selection button{flex:1;min-height:44px;border:0;border-radius:6px;background:transparent;color:var(--muted);font-weight:600;cursor:pointer;}
  button[aria-pressed=true]{background:var(--raised);color:var(--primary);}
  .picker-search{display:block;margin:0 20px 16px;}.picker-results{padding:0 20px 20px;overflow:auto;min-height:100px;}
  .weapon-filters{margin:0 20px 12px;}.weapon-filters p{font-size:12px;color:var(--muted);margin:10px 0 0;}
  .equipment-grid{display:grid;grid-template-columns:repeat(auto-fill,64px);gap:14px;justify-content:start;padding:4px;}
  small{font-size:12px;line-height:1.5;color:var(--muted);}
  .clear-choice{background:transparent;color:var(--primary);min-height:44px;border:0;text-align:left;cursor:pointer;margin-bottom:8px;}
  .effect-selection{display:flex;align-items:center;gap:8px;margin:0 20px 16px;}.effect-selection button{padding:8px;background:var(--canvas);border:1px solid var(--border);font-size:13px;}.effect-selection button[aria-pressed=true]{border-color:var(--primary);color:var(--primary);}
  .effect-choice{width:100%;padding:12px;display:flex;gap:12px;align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:8px;background:var(--canvas);color:var(--ink);text-align:left;margin-bottom:8px;cursor:pointer;}
  .effect-sets{display:flex;flex-wrap:nowrap;justify-content:flex-end;flex:none;padding-left:14px;}.stacked-artifact{display:inline-flex;margin-left:-14px;border-radius:50%;overflow:hidden;border:2px solid var(--canvas);}.effect-choice{min-height:64px;}.effect-choice>strong{font-size:14px;line-height:1.4;}.selected-pair{display:flex;align-items:center;justify-content:center;width:82px;}.selected-pair>:global(span+span){margin-left:-20px;}.empty-label{font-size:10px;color:var(--muted);}.picker-help{font-size:13px;color:var(--muted);}
  .picker-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;border-top:1px solid var(--border);}
  @media(max-width:600px){.equipment-grid{grid-template-columns:repeat(auto-fill,64px);gap:12px;}.picker-header,.picker-results{padding-left:12px;padding-right:12px;}.effect-choice{align-items:center;flex-direction:row;padding:10px;gap:8px;}.effect-sets{justify-content:flex-end;}.effect-choice>strong{font-size:12px;}.stacked-artifact{margin-left:-22px;}.picker-footer{flex-wrap:wrap;}.effect-selection{margin-left:12px;margin-right:12px;}}
</style>
