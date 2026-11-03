<script lang="ts">
  import Shell from '../src/routes/(app)/+layout.svelte';
  import Login from '../src/routes/login/+page.svelte';
  import Profile from '../src/routes/(app)/profile/+page.svelte';
  import Goals from '../src/routes/(app)/goals/+page.svelte';
  import Conflicts from '../src/routes/(app)/conflicts/+page.svelte';
  import Export from '../src/routes/(app)/export/+page.svelte';
  import RecordsPage from '../src/lib/components/RecordsPage.svelte';
  import type { ExportData } from '../src/lib/contracts.ts';
  import { sampleState } from './fixtures.ts';
  let { screen, account = sampleState }: {
    screen: 'login' | 'profile' | 'characters' | 'weapons' | 'inventory' | 'goals' | 'conflicts' | 'export';
    account?: ExportData;
  } = $props();
</script>
{#if screen === 'login'}
  <Login />
{:else}
  <Shell data={{ state: account }}>
    {#if screen === 'profile'}<Profile data={{ state: account }} />
    {:else if screen === 'goals'}<Goals data={{ state: account }} />
    {:else if screen === 'conflicts'}<Conflicts data={{ state: account }} />
    {:else if screen === 'export'}<Export data={{ state: account }} />
    {:else}<RecordsPage state={account} kind={screen} />{/if}
  </Shell>
{/if}
