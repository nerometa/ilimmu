<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { ExportData } from '#lib/contracts.ts';
  import { characterRecordFor, characterBuildFor } from '#lib/game/roster.ts';
  import { catalog } from '#lib/game/builds.ts';
  import { request, messageFor } from '#lib/client.ts';
  import CharacterBuild from './CharacterBuild.svelte';
  import GameImage from './GameImage.svelte';
  import GameIcon from './GameIcon.svelte';
  import FilterOptions from './FilterOptions.svelte';
  import { matchesGameFilters } from '#lib/game/filters.ts';
  let { state:account }:{state:ExportData}=$props();
  let search=$state(''),ownership=$state('all'),sort=$state('name');
  let selectedElements=$state<string[]>([]),selectedWeapons=$state<string[]>([]),selectedRarities=$state<number[]>([]);
  const filterCount=$derived(selectedElements.length+selectedWeapons.length+selectedRarities.length);
  const hasFilters=$derived(!!search.trim()||ownership!=='all'||filterCount>0||sort!=='name');
  const summary=$derived([...selectedElements,...selectedWeapons,...selectedRarities.map(r=>`${r}-star`)].join(' · '));
  let filtersOpen=$state(false);
  let expanded=$state<number[]>([]),pending=$state<number[]>([]),error=$state(''),status=$state('');
  const ownedCount=$derived(catalog.characters.filter(c=>characterRecordFor(account.characters,c.id)?.owned).length);
  const sortedCharacters=$derived([...catalog.characters].sort((a,b)=>sort==='level'?(characterRecordFor(account.characters,b.id)?.level??0)-(characterRecordFor(account.characters,a.id)?.level??0)||a.name.localeCompare(b.name):a.name.localeCompare(b.name)));
  const rows=$derived(sortedCharacters.filter(c=>{
    const owned=characterRecordFor(account.characters,c.id)?.owned??false;
    return matchesGameFilters(c,{search,elements:selectedElements,weaponTypes:selectedWeapons,rarities:selectedRarities})&&(ownership==='all'||(ownership==='owned'?owned:!owned));
  }));
  const visibleIds=$derived(new Set(rows.map(c=>c.id)));
  async function toggle(gameId:number){pending=[...pending,gameId];error='';const record=characterRecordFor(account.characters,gameId);try{await request(`/api/roster/${record?.gameId??gameId}/ownership`,'PUT',{owned:!record?.owned,revision:record?.revision??null});await invalidateAll();status=`${catalog.characters.find(c=>c.id===gameId)?.name} marked ${record?.owned?'not owned':'owned'}.`;}catch(cause){error=messageFor(cause);}finally{pending=pending.filter(id=>id!==gameId);}}
  function clear(){search='';ownership='all';selectedElements=[];selectedWeapons=[];selectedRarities=[];sort='name';}
</script>
<svelte:head><title>Characters | Ilimmu</title></svelte:head>
<header class="characters-heading"><div><h1>Characters</h1><p>Your roster. Your builds.</p></div><span>{ownedCount} owned <span class="muted">/ {catalog.characters.length} characters</span></span></header>
<section class="character-filters" aria-label="Filter characters">
 <div class="filter-toolbar">
  <label class="roster-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg><span class="sr-only">Search characters</span><input type="search" placeholder="Search characters…" bind:value={search} /></label>
  <label class="ownership-filter"><span class="sr-only">Ownership</span><select bind:value={ownership}><option value="all">All characters</option><option value="owned">Owned</option><option value="unowned">Not owned</option></select></label>
  <label class="sort-filter desktop-sort"><span class="sr-only">Sort by</span><select aria-label="Sort by" bind:value={sort}><option value="name">Sort: Name</option><option value="level">Sort: Level</option></select></label>
  <button class="more-filters" type="button" aria-controls="character-filter-options" aria-expanded={filtersOpen} onclick={()=>filtersOpen=!filtersOpen}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h18l-7 8v8l-4-2v-6z"/></svg>Filters{#if filterCount}<span class="filter-count">{filterCount}</span>{/if}</button>
 </div>
 <div id="character-filter-options" class="filter-panel" class:filters-open={filtersOpen}>
  <FilterOptions bind:elements={selectedElements} bind:weapons={selectedWeapons} bind:rarities={selectedRarities} />
  <label class="sort-filter mobile-sort"><span>Sort by</span><select bind:value={sort}><option value="name">Name</option><option value="level">Level</option></select></label>
 </div>
</section>
<div class="roster-results"><p role="status" aria-live="polite" aria-atomic="true">{rows.length} {rows.length===1?'character':'characters'}{#if summary}<span class="filter-summary"> · {summary}</span>{/if}</p><button type="button" disabled={!hasFilters} onclick={clear}>Clear filters</button></div>
<div class="sr-only" role="status">{status}</div>
{#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}
<div class="character-rows">
  {#each sortedCharacters as c (c.id)}
    {@const record=characterRecordFor(account.characters,c.id)}
    {@const build=characterBuildFor(account.builds,c.id)}
    <article class="character-row" hidden={!visibleIds.has(c.id)} class:unowned={!record?.owned} aria-label={c.name}>
      <div class="character-header">
        <a class="character-profile" href={`/characters/${c.id}`} aria-label={`Open ${c.name} profile`}><GameImage kind="characters" id={c.id} size={56} rarity={c.rarity} /></a>
        <div class="character-name"><h2><a href={`/characters/${c.id}`}>{c.name}</a></h2><p><span class="element" data-element={c.element}><GameIcon kind="element" name={c.element} size={14} />{c.element}</span><span class="weapon-meta"><GameIcon kind="weapon" name={c.weaponType} size={14} />{c.weaponType}</span><span>{c.rarity} ★</span>{#if record?.owned}<span>Lv. {record.level}</span>{/if}</p></div>
        <label class="ownership"><span>{record?.owned?'Owned':'Not owned'}</span><input type="checkbox" role="switch" checked={record?.owned??false} disabled={pending.includes(c.id)} onchange={(event)=>{const input=event.currentTarget;toggle(c.id).then(()=>input.checked=characterRecordFor(account.characters,c.id)?.owned??false);}} aria-label={`${c.name} owned`} /></label>
      </div>
      {#if record?.owned || build || expanded.includes(c.id)}<div class="inline-build">{#key c.id}<CharacterBuild gameId={build?.gameId??c.id} weaponType={c.weaponType} saved={build} />{/key}</div>
      {:else}<button type="button" class="plan-character" onclick={()=>expanded=[...expanded,c.id]}>Plan build</button>{/if}
    </article>
  {/each}
  {#if !rows.length}<div class="empty"><h2>No matching characters</h2><p>Try another name or clear your filters.</p><button class="btn" type="button" onclick={clear}>Clear filters</button></div>{/if}
</div>
<style>
  .characters-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:24px;}.characters-heading h1{font-family:inherit;font-weight:700;font-size:30px;margin-bottom:6px;}.characters-heading p{color:var(--muted);margin:0;font-size:14px;}.characters-heading>span{font-size:13px;color:var(--primary);padding-bottom:3px;}
  .character-filters{padding-bottom:16px;border-bottom:1px solid var(--border);min-width:0;}
  .filter-toolbar{display:flex;gap:10px;align-items:center;min-width:0;}
  .filter-toolbar>label{min-width:0;}.ownership-filter{flex:0 1 160px;}.sort-filter{flex:0 1 140px;}
  .character-filters select,.roster-search{height:44px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--ink);padding:0 12px;font-size:14px;min-width:0;width:100%;}
  .filter-toolbar .roster-search{display:flex;align-items:center;gap:10px;flex:1;min-width:120px;}.roster-search input{width:100%;min-width:0;background:transparent;border:0;color:var(--ink);height:100%;font-size:14px;}.roster-search input:focus-visible{outline:none;}.roster-search:focus-within{outline:2px solid var(--primary);outline-offset:3px;}.roster-search svg{flex:none;}
  .filter-panel{padding-top:20px;}.more-filters,.mobile-sort{display:none;}
  .roster-results{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 8px;min-height:44px;}.roster-results p{font-size:12px;color:var(--muted);margin:0;}.filter-summary{color:var(--ink);}.roster-results button,.plan-character{color:var(--muted);font-size:12px;border:0;background:transparent;cursor:pointer;min-height:44px;flex:none;}.roster-results button:hover,.plan-character:hover{color:var(--primary);}.roster-results button:disabled{opacity:.5;cursor:default;}
  .character-rows{display:grid;gap:12px;}.character-row{background:var(--surface);border-radius:12px;padding:16px;}.character-header{display:flex;align-items:center;gap:12px;}.character-profile{display:block;flex:none;border-radius:8px;transition:filter 140ms;}.character-profile:hover{filter:brightness(1.15);}.character-name{flex:1;min-width:0;}.character-name h2{font-size:18px;margin:0 0 6px;}.character-name h2 a{color:var(--ink);text-decoration:none;}.character-name h2 a:hover{color:var(--primary);}.character-name p{display:flex;flex-wrap:wrap;gap:4px 12px;color:var(--muted);font-size:11px;margin:0;line-height:1.5;}
  .ownership{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);min-height:44px;cursor:pointer;}.ownership input{appearance:none;width:34px;height:20px;background:var(--raised);border:1px solid #8591a8;border-radius:12px;position:relative;cursor:pointer;transition:background 140ms;}.ownership input:before{content:'';position:absolute;width:12px;height:12px;top:3px;left:3px;border-radius:50%;background:var(--muted);transition:transform 140ms;}.ownership input:checked{background:var(--primary);border-color:var(--primary);}.ownership input:checked:before{background:var(--canvas);transform:translateX(14px);}.ownership input:disabled{opacity:.5;cursor:wait;}
  .inline-build{margin-top:14px;}.plan-character{margin:8px 0 -4px;padding:0;}.element[data-element=Hydro]{color:#A5C9FF;}.element[data-element=Pyro]{color:#FFB4A0;}.element[data-element=Electro]{color:#CBB6F0;}.element[data-element=Anemo]{color:#8ED9BE;}.element[data-element=Cryo]{color:#AAE2ED;}.element[data-element=Geo]{color:#E3BD73;}.element[data-element=Dendro]{color:#C0D990;}
  .element,.weapon-meta{display:inline-flex;align-items:center;gap:4px;}
  @media(max-width:600px){.characters-heading{align-items:start;flex-direction:column;gap:8px;margin-bottom:20px;}.filter-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;}.filter-toolbar .roster-search{grid-column:1/-1;min-width:0;}.desktop-sort{display:none;}.more-filters{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 12px;color:var(--ink);background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:14px;cursor:pointer;}.more-filters[aria-expanded=true]{border-color:var(--primary);}.filter-count{color:var(--primary);font-variant-numeric:tabular-nums;}.filter-panel:not(.filters-open){display:none;}.mobile-sort{display:grid;gap:8px;margin-top:16px;font-size:12px;color:var(--muted);max-width:180px;}.character-row{padding:12px;}.character-header{gap:10px;align-items:start;}.character-name h2{font-size:16px;line-height:1.35;overflow-wrap:anywhere;}.ownership{flex-direction:column-reverse;gap:4px;font-size:10px;}.character-name p{gap:4px 8px;font-size:12px;}.character-name{padding-top:2px;}.characters-heading h1{font-size:28px;}.roster-results{align-items:start;}.roster-results p{padding-top:12px;}.roster-results button{padding-right:0;}}
  @media(prefers-reduced-motion:reduce){.ownership input,.ownership input:before,.character-profile{transition:none;}}
</style>
