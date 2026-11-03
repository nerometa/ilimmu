import assert from 'node:assert/strict';
import postgres from 'postgres';
import { z } from 'zod';

const input = z.object({
  DATABASE_URL: z.url(), QA_BASE_URL: z.url(),
  OWNER_EMAIL: z.email(), OWNER_PASSWORD: z.string().min(12),
  QA_DISPOSABLE_DATABASE: z.literal('true')
}).parse(process.env);
const databaseUrl = new URL(input.DATABASE_URL);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(databaseUrl.hostname));
assert.match(databaseUrl.pathname, /^\/companion_(?:qa|e2e|test)_[a-zA-Z0-9_]+$/);
const origin = new URL(input.QA_BASE_URL).origin;
const sql = postgres(input.DATABASE_URL, { max: 1, onnotice: () => undefined });
let cookie = '';

async function call(path: string, method: string, body: unknown, expected: number) {
  const response = await fetch(new URL(path, origin), {
    method, headers: { origin, cookie, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: 'manual', signal: AbortSignal.timeout(15000)
  });
  await response.arrayBuffer();
  console.info(JSON.stringify({
    scenario: `${method} ${path}`, status: response.status,
    headers: Object.fromEntries([...response.headers].map(([key, value]) =>
      [key, key === 'set-cookie' ? '<redacted>' : value])),
    body: '<authentication response redacted>'
  }));
  assert.equal(response.status, expected);
  return response;
}

async function login(password: string, expected = 200) {
  const response = await call('/api/auth/sign-in/email', 'POST', {
    email: input.OWNER_EMAIL, password
  }, expected);
  if (expected === 200) {
    cookie = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
    assert.ok(cookie);
  }
}

async function operator(mode: 'provision' | 'reset', password: string, expected: number) {
  const child = Bun.spawn(['bun', 'scripts/owner.ts', mode], {
    env: { ...process.env, OWNER_PASSWORD: password },
    stdout: 'pipe', stderr: 'pipe'
  });
  // Operator failures may include driver details; retain only the exit verdict.
  await Promise.all([new Response(child.stdout).arrayBuffer(), new Response(child.stderr).arrayBuffer()]);
  const exit = await child.exited;
  console.info(`Operator ${mode}: exit ${exit}, expected ${expected}. Credentials not logged.`);
  assert.equal(exit, expected);
}

async function isolateAuthScenario() {
  // Reset only the explicitly disposable fixture's persisted limiter buckets.
  // Each scenario still runs the unchanged production limiter and HTTP handler.
  await sql`DELETE FROM auth_rate_limit`;
}

let rotated = false;
try {
  await isolateAuthScenario();
  await operator('provision', input.OWNER_PASSWORD, 1);
  await call('/api/auth/sign-up/email', 'POST', {
    email: 'blocked@example.test', password: crypto.randomUUID(), name: 'Blocked'
  }, 400);
  await login(input.OWNER_PASSWORD);
  await call('/api/state', 'GET', undefined, 200);
  await sql`
    UPDATE auth_session SET expires_at = now() - interval '1 second'
    WHERE user_id = (SELECT id FROM auth_user WHERE email = ${input.OWNER_EMAIL})
  `;
  await call('/api/state', 'GET', undefined, 401);

  await isolateAuthScenario();
  await login(input.OWNER_PASSWORD);
  const temporaryPassword = crypto.randomUUID();
  await operator('reset', temporaryPassword, 0);
  rotated = true;
  await call('/api/state', 'GET', undefined, 401);
  await login(input.OWNER_PASSWORD, 401);
  await isolateAuthScenario();
  await login(temporaryPassword);
  await call('/api/state', 'GET', undefined, 200);
  await operator('reset', input.OWNER_PASSWORD, 0);
  rotated = false;
  await call('/api/state', 'GET', undefined, 401);

  await isolateAuthScenario();
  await login(input.OWNER_PASSWORD);
  await call('/api/auth/sign-out', 'POST', {}, 200);
  await call('/api/state', 'GET', undefined, 401);

  await isolateAuthScenario();
  let throttled = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await fetch(new URL('/api/auth/sign-in/email', origin), {
      method: 'POST', headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ email: input.OWNER_EMAIL, password: crypto.randomUUID() }),
      signal: AbortSignal.timeout(15000)
    });
    await response.arrayBuffer();
    console.info(`Invalid-login burst attempt ${attempt + 1}: HTTP ${response.status}.`);
    if (response.status === 429) { throttled = true; break; }
    assert.equal(response.status, 401);
  }
  assert.ok(throttled, 'Production authentication rate limit must reject a burst.');
  await isolateAuthScenario();
  console.info('PASS: sole provisioning, signup rejection, expiry, reset revocation, logout, throttling429.');
} finally {
  if (rotated) await operator('reset', input.OWNER_PASSWORD, 0);
  await sql.end();
}
