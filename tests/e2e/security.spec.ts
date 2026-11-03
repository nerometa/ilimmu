import { test, expect } from '@playwright/test';

test('built HTTP boundaries, expiry, operator reset and throttle use the isolated QA database', async ({}, info) => {
  for (const script of ['scripts/verify-http.ts', 'scripts/verify-auth.ts']) {
    const child = Bun.spawn(['bun', script], {
      env: process.env, stdout: 'pipe', stderr: 'pipe'
    });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited
    ]);
    await info.attach(script.endsWith('auth.ts') ? 'auth-proof' : 'http-proof', {
      body: `${stdout}\n${stderr}`, contentType: 'text/plain'
    });
    expect(exit, `${script} failed; see its sanitized proof attachment.`).toBe(0);
  }
});

test('failed QA database creation preserves an existing database', async ({ request }) => {
  // The running app owns this fixture; a second setup process does not.
  const collision = Bun.spawn(['bun', 'scripts/e2e-server.ts'], {
    env: process.env, stdout: 'pipe', stderr: 'pipe'
  });
  const [, , exit] = await Promise.all([
    new Response(collision.stdout).arrayBuffer(),
    new Response(collision.stderr).arrayBuffer(),
    collision.exited
  ]);
  expect(exit).toBe(1);
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
});
