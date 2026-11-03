<script lang="ts">
  import { request, messageFor } from '#lib/client.ts';
  import Notice from '#lib/components/Notice.svelte';
  import TravelerPortrait from '#lib/components/TravelerPortrait.svelte';
  let email = $state('');
  let password = $state('');
  let pending = $state(false);
  let error = $state('');
  async function signin(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';
    try {
      await request('/api/auth/sign-in/email', 'POST', { email, password });
      window.location.assign('/profile');
    } catch (cause) { error = messageFor(cause); }
    finally { pending = false; }
  }
</script>

<svelte:head><title>Sign in | Ilimmu</title></svelte:head>
<main class="auth-page">
  <div class="auth-intro">
    <div class="auth-illustration"><TravelerPortrait /></div>
    <p class="eyebrow">A companion for your journey</p>
    <h1>Every build begins here.</h1>
    <p class="muted">Your characters. Your progress. Your next goal.<br />One private place to keep them together.</p>
    <p><strong>Ilimmu</strong></p>
  </div>
  <section class="panel" aria-labelledby="signin-heading">
    <h2 id="signin-heading">Owner sign-in</h2>
    <p class="muted">Use your provisioned owner account.</p>
    <Notice message={error} {pending} pendingMessage="Signing in..." showSessionRecovery={false} />
    <form onsubmit={signin} class="journal-stack">
      <label class="field"><span>Email</span><input class="input" type="email" autocomplete="username" required bind:value={email} /></label>
      <label class="field"><span>Password</span><input class="input" type="password" autocomplete="current-password" required bind:value={password} /></label>
      <button class="btn btn-primary" disabled={pending}>{pending ? 'Signing in...' : 'Sign in'}</button>
    </form>
  </section>
  <p class="muted auth-footnote">Actual records and future targets, kept separate. A private, unofficial companion for Genshin Impact.</p>
</main>
