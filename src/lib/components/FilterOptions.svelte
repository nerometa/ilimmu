<script lang="ts">
  import { elements as allElements, weaponTypes as allWeapons } from '#lib/game/filters.ts';
  import GameIcon from './GameIcon.svelte';
  let {
    elements = $bindable<string[]>([]), weapons = $bindable<string[]>([]), rarities = $bindable<number[]>([]),
    showElements = true, showWeapons = true, rarityChoices = [5, 4]
  }: {
    elements?: string[]; weapons?: string[]; rarities?: number[];
    showElements?: boolean; showWeapons?: boolean; rarityChoices?: number[];
  } = $props();
</script>
<div class="filter-options">
  {#if showElements}
    <fieldset><legend>Elements</legend><div class="choices">
      {#each allElements as element (element)}
        <button type="button" class="filter-chip" aria-label={element} title={element} aria-pressed={elements.includes(element)} onclick={() => elements = elements.includes(element) ? elements.filter(e => e !== element) : [...elements, element]}><GameIcon kind="element" name={element} /></button>
      {/each}
    </div></fieldset>
  {/if}
  <fieldset><legend>Rarity</legend><div class="choices">
    {#each rarityChoices as rarity (rarity)}
      <button type="button" class="filter-chip rarity-chip" data-rarity={rarity} aria-label={`${rarity}-star`} title={`${rarity}-star`} aria-pressed={rarities.includes(rarity)} onclick={() => rarities = rarities.includes(rarity) ? rarities.filter(r => r !== rarity) : [...rarities, rarity]}>
        <span>{rarity}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1z" /></svg>
      </button>
    {/each}
  </div></fieldset>
  {#if showWeapons}
    <fieldset><legend>Weapon type</legend><div class="choices">
      {#each allWeapons as weapon (weapon)}
        <button type="button" class="filter-chip" aria-label={weapon} title={weapon} aria-pressed={weapons.includes(weapon)} onclick={() => weapons = weapons.includes(weapon) ? weapons.filter(w => w !== weapon) : [...weapons, weapon]}><GameIcon kind="weapon" name={weapon} /></button>
      {/each}
    </div></fieldset>
  {/if}
</div>
<style>
  .filter-options { display: flex; flex-wrap: wrap; gap: 16px 24px; min-width: 0; }
  fieldset { min-width: 0; padding: 0; margin: 0; border: 0; max-width: 100%; }
  legend { color: var(--muted); font-size: 12px; font-weight: 600; margin-bottom: 8px; padding: 0; }
  .choices { display: flex; flex-wrap: wrap; gap: 6px; }
  .filter-chip { display: inline-flex; align-items: center; justify-content: center; gap: 5px; flex: none; width: 44px; height: 44px; padding: 8px; background: var(--canvas); border: 1px solid var(--border); border-radius: 8px; color: var(--muted); cursor: pointer; transition: background 140ms, border-color 140ms; }
  .filter-chip:hover { background: var(--raised); border-color: var(--muted); }
  .filter-chip[aria-pressed=true] { background: var(--raised); border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); color: var(--ink); }
  .rarity-chip { width: 60px; font-size: 14px; font-weight: 650; }
  .rarity-chip[data-rarity='5'] { color: var(--primary); }
  .rarity-chip[data-rarity='4'] { color: #cbb6f0; }
  @media (max-width: 600px) { .filter-options { gap: 16px; } }
  @media (prefers-reduced-motion: reduce) { .filter-chip { transition: none; } }
</style>
