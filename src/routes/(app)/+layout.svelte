<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { request, messageFor } from '#lib/client.ts';
  import Notice from '#lib/components/Notice.svelte';
  import JournalIcon from '#lib/components/JournalIcon.svelte';
  let { data, children } = $props();
  const links = ['Profile', 'Characters', 'Weapons', 'Inventory', 'Goals', 'Conflicts', 'Export'];
  let menuButton: HTMLButtonElement;
  let collapse: { hide(): boolean; destroy(): void } | undefined;
  let menuReady = $state(false);
  let error = $state('');
  let pending = $state(false);
  onMount(() => {
    let disposed = false;
    import('flyonui/dist/collapse.mjs').then(({ default: HSCollapse }) => {
      if (!disposed) {
        HSCollapse.autoInit();
        const instance = HSCollapse.getInstance(menuButton, true);
        if (instance && 'element' in instance) {
          collapse = instance.element;
          menuReady = true;
        }
      }
    }).catch(() => { error = 'The navigation menu could not initialize. Reload the page to try again.'; });
    return () => { disposed = true; collapse?.destroy(); };
  });
  async function signout() {
    pending = true;
    try { await request('/api/auth/sign-out', 'POST', {}); window.location.assign('/login'); }
    catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
</script>

<svelte:window onkeydown={(event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    collapse?.hide();
    menuButton.focus();
  }
}} />

{#snippet navigation()}
  {#each links as label (label)}
    <a href={'/' + label.toLowerCase()} aria-current={page.url.pathname === '/' + label.toLowerCase() ? 'page' : undefined} onclick={() => collapse?.hide()}>
      <JournalIcon name={label} /><span>{label}{label === 'Conflicts' && data.state.conflicts.some((c) => c.resolution === null) ? ` (${data.state.conflicts.filter((c) => c.resolution === null).length})` : ''}</span>
    </a>
  {/each}
{/snippet}
<a class="skip-link" href="#main-content">Skip to content</a>
<div class="shell">
  <aside class="sidebar">
    <a class="brand" href="/profile"><span class="eyebrow" style="display:block;font-size:12px;margin-bottom:8px">Your private account</span>Genshin<br />Companion</a>
    <nav aria-label="Main navigation">{@render navigation()}</nav>
    <div class="sidebar-footer">
      <div class="element-spectrum" aria-hidden="true">
        {#each ['#eb9682', '#83b6ec', '#bba1eb', '#a6c778', '#84d2b4', '#9ad7e5', '#e0c48b'] as color (color)}<span style:--element-color={color}></span>{/each}
      </div>
      Actuals first.<br />Plans apart.
      <p style="font-size:12px;margin-top:16px">Unofficial Genshin Impact companion</p>
    </div>
  </aside>
  <div class="workspace">
    <div class="mobile-nav">
      <div class="cluster" style="justify-content:space-between">
        <a class="brand" href="/profile">Ilimmu</a>
        <button bind:this={menuButton} class="btn collapse-toggle" type="button" data-collapse="#mobile-menu" aria-controls="mobile-menu" aria-expanded="false" disabled={!menuReady}>Menu</button>
      </div>
      <div id="mobile-menu" class="collapse hidden"><nav aria-label="Mobile navigation">{@render navigation()}</nav></div>
    </div>
    <header class="topbar">
      <span><strong>{data.state.profile.name}</strong> <span class="muted">/ {data.state.profile.server}</span></span>
      <button class="btn" type="button" onclick={signout} disabled={pending}>{pending ? 'Signing out...' : 'Sign out'}</button>
    </header>
    <main id="main-content" class="main-content" tabindex="-1">
      <Notice message={error} />
      {@render children()}
    </main>
  </div>
</div>
