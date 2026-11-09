<script lang="ts">
  import CharactersPage from '#lib/components/CharactersPage.svelte';
  let { data } = $props();
</script>
<CharactersPage state={data.state} />
