<script lang="ts">
  let { name }: { name: string } = $props();
  const paths: Record<string, string> = {
    Profile: 'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    Characters: 'M16 21v-2a5 5 0 0 0-10 0v2M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 4a4 4 0 0 1 0 8M22 21v-2a5 5 0 0 0-4-5',
    Weapons: 'm4 20 6-6m-2-2 4 4M9 13 18 3l3 0 0 3-10 9M3 21l2-2',
    Inventory: 'M4 8h16v13H4V8ZM3 3h18v5H3V3ZM9 12h6',
    Goals: 'M5 21V3m0 1h14l-3 5 3 5H5',
    Conflicts: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
    Export: 'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5'
  };
</script>
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] ?? paths.Profile} /></svg>
