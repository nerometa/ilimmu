<script lang="ts">
  import RecordsPage from '#lib/components/RecordsPage.svelte';
  let { data } = $props();
</script>
<RecordsPage state={data.state} kind="characters" />
