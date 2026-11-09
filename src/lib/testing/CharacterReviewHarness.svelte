<script lang="ts">
  import type { ExportData } from '#lib/contracts.ts';
  import { emptyBuild } from '#lib/game/builds.ts';
  import CharacterBuild from '#lib/components/CharacterBuild.svelte';
  import CharacterProgression from '#lib/components/CharacterProgression.svelte';
  import CharactersPage from '#lib/components/CharactersPage.svelte';
  import GameImage from '#lib/components/GameImage.svelte';

  let { mode, state: account }: { mode: 'build' | 'progression' | 'roster' | 'image'; state: ExportData } = $props();
  const profileId = '10000000-0000-4000-8000-000000000001';
  const updatedAt = '2026-11-01T00:00:00.000Z';
  let saved = $state<ExportData['builds'][number]>({
    ...emptyBuild, gameId: 10000089, profileId, revision: 0, updatedAt, sands: 'HP%'
  });
  let record = $state<ExportData['characters'][number]>({
    id: '10000000-0000-4000-8000-000000000002', profileId, gameId: 10000089,
    name: 'Furina', owned: true, level: 20, ascension: 1,
    talentAttack: 1, talentSkill: 1, talentBurst: 1, revision: 0,
    manualOverride: true, source: 'manual', updatedAt
  });
  let imageId = $state(999999);
</script>

{#if mode === 'build'}
  <button type="button" onclick={() => saved = { ...saved, revision: 1, sands: 'DEF%' }}>Load newer saved values</button>
  <CharacterBuild gameId={saved.gameId} weaponType="Sword" {saved} />
{:else if mode === 'progression'}
  <button type="button" onclick={() => record = { ...record, revision: 1, level: 40, owned: false }}>Load newer saved values</button>
  <CharacterProgression {record} />
{:else if mode === 'roster'}
  <CharactersPage state={account} />
{:else}
  <button type="button" onclick={() => imageId = 10000089}>Load working image</button>
  <GameImage kind="characters" id={imageId} />
{/if}
