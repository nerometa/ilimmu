<script lang="ts">
  import { isTravelerId } from '#lib/game/roster.ts';
  let { kind, id, size = 48, rarity }: { kind: 'characters' | 'weapons' | 'artifacts' | 'slot'; id: number | string; size?: number; rarity?: number } = $props();
  let failedSrc = $state<string | null>(null);
  const src = $derived(kind === 'slot' ? `/game/slot-${id}.png` : kind==='characters' && isTravelerId(Number(id)) ? '/game/traveler.webp' : `/game/${kind}-${id}.png`);
</script>
<span class="game-image" data-rarity={rarity} style:width={`${size}px`} style:height={`${size}px`}>
  {#if failedSrc !== src}{#key src}<img src={src} alt="" width={size} height={size} loading="lazy" onerror={event => failedSrc = event.currentTarget.getAttribute('src')} />{/key}{:else}<span aria-hidden="true">—</span>{/if}
</span>
<style>
  .game-image { display:inline-flex; flex:none; align-items:center; justify-content:center; overflow:hidden; border-radius:8px; background:var(--raised); vertical-align:middle; }
  .game-image[data-rarity='5']{background:var(--rarity-5);}.game-image[data-rarity='4']{background:var(--rarity-4);}.game-image[data-rarity='3']{background:var(--rarity-3);}.game-image[data-rarity='2']{background:var(--rarity-2);}.game-image[data-rarity='1']{background:var(--rarity-1);}
  .game-image:has(img[src*='slot-']){background:transparent;border-radius:0;}
  img {width:100%;height:100%;object-fit:contain;}
</style>
