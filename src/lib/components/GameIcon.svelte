<script lang="ts">
  let { kind, name, size = 24 }: { kind: 'element' | 'weapon'; name: string; size?: number } = $props();
</script>
<img class="game-icon" class:weapon={kind==='weapon'} src={`/game/icons/${kind}-${name.toLowerCase()}.${kind==='element'?'svg':'png'}`} alt="" aria-hidden="true" width={size} height={size} />
<style>
  .game-icon { display: block; flex: none; object-fit: contain; }
  .weapon { filter: brightness(0) invert(1); }
</style>
