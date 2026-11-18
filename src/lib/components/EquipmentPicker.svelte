<script lang="ts">
  import { catalog, effects, setsForEffect, type Build } from '#lib/game/builds.ts';
  import GameImage from './GameImage.svelte';
  import EquipmentTile from './EquipmentTile.svelte';
  import FilterOptions from './FilterOptions.svelte';
  import { matchesGameFilters } from '#lib/game/filters.ts';
  type PickerProps =
    | { kind: 'weapon'; weaponType: string; weaponId: Build['weaponId']; onweapon: (id: Build['weaponId']) => void }
    | { kind: 'artifacts'; artifacts: Build['artifacts']; onartifacts: (value: Build['artifacts']) => void };

  let props: PickerProps = $props();
  const kind = $derived(props.kind);
  let dialog:HTMLDialogElement;
  let search=$state('');
  let rarities=$state<number[]>([]);
  let mode=$state<'4pc'|'2pc+2pc'>('4pc');
  let effect1=$state<string|null>(null);
  let effect2=$state<string|null>(null);
  let effectSlot=$state<1|2>(1);
  const item = $derived.by(() => {
    if (props.kind === 'weapon') {
      const { weaponId } = props;
      return catalog.weapons.find(weapon => weapon.id === weaponId);
    }
    const { artifacts } = props;
    if (artifacts.mode === '4pc') return catalog.artifacts.find(set => set.id === artifacts.setId);
  });
  const pair = $derived(props.kind === 'artifacts' && props.artifacts.mode === '2pc+2pc' ? props.artifacts : undefined);
  const label = $derived(`Choose ${kind === 'weapon' ? 'weapon' : 'artifacts'}: ${pair?.mode ?? item?.name ?? 'None selected'}`);
  const weapons = $derived.by(() => {
    if (props.kind !== 'weapon') return [];
    const { weaponType } = props;
    return catalog.weapons.filter(weapon => weapon.weaponType === weaponType && matchesGameFilters(weapon, { search, rarities }));
  });
  const sets=$derived(catalog.artifacts.filter(a=>a.effect4 && `${a.name} ${a.effect2} ${a.effect4}`.toLowerCase().includes(search.toLowerCase())));
  const filteredEffects=$derived(effects.filter(e=>`${e} ${setsForEffect(e).map(a=>a.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())));
  const validPair=$derived(effect1 && effect2 && (effect1!==effect2 || setsForEffect(effect1).length>=2));
  const pairSets = $derived.by(() => {
    if (!pair) return [];
    const first = pair.effect1 ? setsForEffect(pair.effect1)[0] : undefined;
    const second = pair.effect2 ? setsForEffect(pair.effect2).find(set => set.id !== first?.id) : undefined;
    return [first, second];
  });
  function open() {
    search = '';
    rarities = [];
    mode = pair?.mode ?? '4pc';
    effect1 = pair?.effect1 ?? null;
    effect2 = pair?.effect2 ?? null;
    effectSlot = 1;
    dialog.showModal();
    dialog.querySelector('input')?.focus();
  }
  function chooseEffect(value:string){if(effectSlot===1){effect1=value;effectSlot=2;}else effect2=value;}
</script>
{#snippet pairArtwork()}
  <span class="selected-pair" aria-hidden="true">
    {#each pairSets as set, slot (slot)}
      {#if set}
        <span class="pair-icon" class:second={slot === 1}>
          <GameImage kind="artifacts" id={set.id} size={43} />
        </span>
      {/if}
    {/each}
  </span>
  <span class="pair-label">{pair?.mode}</span>
{/snippet}
<EquipmentTile kind={kind === 'weapon' ? 'weapons' : 'artifacts'} {item} {label} onclick={open}
  children={pair ? pairArtwork : undefined} />
<dialog bind:this={dialog} class="equipment-dialog" aria-label={kind==='weapon'?'Choose weapon':'Choose artifacts'}>
  <div class="picker-header"><h2>{kind==='weapon'?'Choose weapon':'Choose artifacts'}</h2><button type="button" class="btn" onclick={()=>dialog.close()} aria-label="Close picker">Close</button></div>
  {#if kind==='artifacts'}
    <div class="picker-modes" aria-label="Artifact combination">
      <button type="button" aria-pressed={mode==='4pc'} onclick={()=>{mode='4pc';search='';}}>4 pieces</button>
      <button type="button" aria-pressed={mode==='2pc+2pc'} onclick={()=>{mode='2pc+2pc';search='';}}>2 pieces + 2 pieces</button>
    </div>
  {/if}
  <label class="picker-search"><span class="sr-only">Search {kind==='weapon'?'weapons':'artifacts and effects'}</span><input class="input" type="search" placeholder={kind==='weapon'?'Search weapons or secondary stats…':'Search sets or effects…'} bind:value={search} /></label>
  {#if props.kind === 'weapon'}<div class="weapon-filters"><FilterOptions showElements={false} showWeapons={false} rarityChoices={[5,4,3,2,1]} bind:rarities /><p role="status">{weapons.length} {props.weaponType.toLowerCase()} weapons</p></div>{/if}
  {#if kind==='artifacts' && mode==='2pc+2pc'}
    <div class="effect-selection">
      <button type="button" aria-pressed={effectSlot===1} onclick={()=>effectSlot=1}>{effect1??'Choose first effect'}</button><span>+</span>
      <button type="button" aria-pressed={effectSlot===2} onclick={()=>effectSlot=2}>{effect2??'Choose second effect'}</button>
    </div>
  {/if}
  <div class="picker-results">
    {#if props.kind === 'weapon'}
      {@const { onweapon } = props}
      <button class="clear-choice" type="button" onclick={()=>{onweapon(null);dialog.close();}}>No weapon selected</button>
      <div class="equipment-grid">{#each weapons as w (w.id)}<EquipmentTile kind="weapons" item={w} showInfo label={w.name} onclick={()=>{onweapon(w.id);dialog.close();}} />{/each}</div>
      {#if !weapons.length}<p class="muted">No weapons match. Try another name or rarity.</p><button class="clear-choice" type="button" onclick={()=>{search='';rarities=[];}}>Clear weapon filters</button>{/if}
    {:else if mode==='4pc'}
      {@const { onartifacts } = props}
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
  {#if props.kind === 'artifacts' && mode==='2pc+2pc'}{@const { onartifacts } = props}<footer class="picker-footer"><small>{effect1===effect2&&effect1&&!validPair?'This effect is available from only one set. Choose another effect.':'Two different sets activate both bonuses.'}</small><button class="btn btn-primary" type="button" disabled={!validPair} onclick={()=>{onartifacts({mode:'2pc+2pc',effect1,effect2});dialog.close();}}>Use these effects</button></footer>{/if}
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
  .effect-sets{display:flex;flex-wrap:nowrap;justify-content:flex-end;flex:none;padding-left:14px;}.stacked-artifact{display:inline-flex;margin-left:-14px;border-radius:50%;overflow:hidden;border:2px solid var(--canvas);}.effect-choice{min-height:64px;}.effect-choice>strong{font-size:14px;line-height:1.4;}.picker-help{font-size:13px;color:var(--muted);}
  .selected-pair {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: inherit;
    background: linear-gradient(135deg, transparent 49.5%, #0003 49.5% 50.5%, transparent 50.5%), #b07636;
  }
  .pair-icon { position: absolute; top: 0; left: 0; }
  .pair-icon.second { inset: auto 0 0 auto; }
  .pair-icon :global(.game-image) { background: transparent; }
  .pair-label { color: var(--ink); font-size: 11px; font-weight: 600; }
  .picker-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;border-top:1px solid var(--border);}
  @media(max-width:600px){.equipment-grid{grid-template-columns:repeat(auto-fill,64px);gap:12px;}.picker-header,.picker-results{padding-left:12px;padding-right:12px;}.effect-choice{align-items:center;flex-direction:row;padding:10px;gap:8px;}.effect-sets{justify-content:flex-end;}.effect-choice>strong{font-size:12px;}.stacked-artifact{margin-left:-22px;}.picker-footer{flex-wrap:wrap;}.effect-selection{margin-left:12px;margin-right:12px;}}
</style>
