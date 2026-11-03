import assert from 'node:assert/strict';
import { z } from 'zod';
import { exportSchema } from '../src/lib/contracts';
import type { ExportData } from '../src/lib/contracts';

const config = z.object({
  QA_BASE_URL: z.url(),
  OWNER_EMAIL: z.email(),
  OWNER_PASSWORD: z.string().min(12)
}).parse(process.env);
const origin = new URL(config.QA_BASE_URL).origin;
let cookie = '';

async function call(method: string, path: string, body: unknown, expected: number, requestOrigin: string | null = origin) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookie) headers.set('cookie', cookie);
  if (requestOrigin !== null) headers.set('origin', requestOrigin);
  const response = await fetch(new URL(path, origin), {
    method, headers, redirect: 'manual', signal: AbortSignal.timeout(15000),
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;
  const authPath = path.startsWith('/api/auth/');
  console.info(JSON.stringify({
    scenario: `${method} ${path}`, origin: requestOrigin,
    status: response.status,
    headers: Object.fromEntries([...response.headers].map(([key, value]) =>
      [key, key === 'set-cookie' ? '<redacted>' : value])),
    body: authPath ? '<authentication response redacted>' : parsed
  }));
  assert.equal(response.status, expected, `${method} ${path}: ${text.slice(0, 300)}`);
  return { response, body: parsed };
}

async function login(password = config.OWNER_PASSWORD) {
  const result = await call('POST', '/api/auth/sign-in/email', {
    email: config.OWNER_EMAIL, password
  }, 200);
  cookie = result.response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  assert.ok(cookie, 'Database session cookie must be issued.');
}

async function state(): Promise<ExportData> {
  return exportSchema.parse((await call('GET', '/api/state', undefined, 200)).body);
}

await call('GET', '/api/inventory', undefined, 401);
await login();
const before = await state();
const profileBody = {
  uid: before.profile.uid, name: 'QA Traveler', server: before.profile.server,
  revision: before.profile.revision
};
await call('PUT', '/api/profile', profileBody, 200);
await call('PUT', '/api/profile', profileBody, 403, 'https://foreign.example');
await call('PUT', '/api/profile', profileBody, 403, null);
await call('PUT', '/api/profile', profileBody, 409);

if (process.argv.includes('--origin-only')) {
  console.info('PASS: same-origin mutation, foreign/missing origin rejection, stale409.');
} else {
  await call('POST', '/api/auth/sign-up/email', {
    email: 'unapproved@example.test', password: crypto.randomUUID(), name: 'Not allowed'
  }, 400);
  await call('POST', '/api/inventory', { gameId: 202, name: 'Mora', quantity: -1 }, 422);
  await call('POST', '/api/inventory', { gameId: 202, name: 'Mora', quantity: 0.5 }, 422);

  const current = await state();
  let material = current.inventory.find((row) => row.gameId === 202);
  if (!material) {
    await call('POST', '/api/inventory', { gameId: 202, name: 'Mora', quantity: 1000 }, 200);
    material = (await state()).inventory.find((row) => row.gameId === 202);
  }
  assert.ok(material);
  await call('PUT', `/api/inventory/${material.id}`, {
    gameId: 202, name: 'Mora', quantity: 1200, revision: material.revision
  }, 200);
  await call('PUT', `/api/inventory/${material.id}`, {
    gameId: 202, name: 'Mora', quantity: 1, revision: material.revision
  }, 409);
  const corrected = (await state()).inventory.find((row) => row.id === material.id);
  assert.equal(corrected?.quantity, 1200);
  assert.equal(corrected?.manualOverride, true);
  assert.ok(corrected);

  for (const resolution of ['keep-manual', 'accept-source'] as const) {
    const live: ExportData['inventory'][number] | undefined =
      (await state()).inventory.find((row) => row.id === corrected.id);
    assert.ok(live);
    await call('POST', '/api/conflicts/stage', {
      inventoryId: live.id, quantity: 300, revision: live.revision, source: 'fixture-observation'
    }, 200);
    const staged = await state();
    const conflict = staged.conflicts.find((row) => row.inventoryId === live.id && row.resolution === null);
    assert.ok(conflict);
    assert.equal(staged.inventory.find((row) => row.id === live.id)?.quantity, 1200);
    await call('POST', `/api/conflicts/${conflict.id}/resolve`, {
      resolution, revision: conflict.revision, inventoryRevision: live.revision
    }, 200);
    const actual = (await state()).inventory.find((row) => row.id === live.id);
    assert.equal(actual?.quantity, resolution === 'keep-manual' ? 1200 : 300);
    assert.equal(actual?.manualOverride, resolution === 'keep-manual');
  }

  const downloaded = await call('GET', '/api/exports', undefined, 200);
  const output = exportSchema.parse(downloaded.body);
  assert.match(downloaded.response.headers.get('content-disposition') ?? '', /^attachment;/);
  assert.equal(output.profile.lastExportGeneratedAt, output.generatedAt);
  assert.ok(!JSON.stringify(output).includes(config.OWNER_EMAIL));
  assert.ok(!JSON.stringify(output).includes(config.OWNER_PASSWORD));
  assert.ok(!JSON.stringify(output).includes('ownerId'));
  await call('POST', '/api/auth/sign-out', {}, 200);
  await call('GET', '/api/state', undefined, 401);
  console.info('PASS: HTTP auth/origin/validation/revisions/conflict resolutions/export/logout.');
}
