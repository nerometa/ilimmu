import { Elysia, t } from 'elysia';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { auth } from '#lib/server/account/auth.ts';
import {
  characterInput, characterEdit, weaponInput, weaponEdit, inventoryInput,
  inventoryEdit, profileInput, goalInput, goalEdit, stageInput, resolveInput
} from '#lib/contracts.ts';
import {
  ownerProfile, saveProfile, addCharacter, saveCharacter,
  addWeapon, saveWeapon, addInventory, saveInventory
} from '#lib/server/records/service.ts';
import { saveGoal } from '#lib/server/goals/service.ts';
import { stageObservation, resolveConflict } from '#lib/server/integrations/staging.ts';
import { personalData } from '#lib/server/exports/service.ts';
import { WriteError } from '#lib/server/provenance/safe-write.ts';
import type { RequestHandler } from './$types';

async function profileId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error('Authenticated boundary invariant failed.');
  return (await ownerProfile(session.user.id)).id;
}

const app = new Elysia({ prefix: '/api' })
  .onError(({ error, code, set }) => {
    if (error instanceof WriteError) {
      set.status = error.status;
      return { error: { code: error.code, message: error.message } };
    }
    if (code === 'VALIDATION' || code === 'PARSE') {
      set.status = 422;
      return { error: { code: 'VALIDATION_ERROR', message: 'Check the submitted fields and try again.' } };
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } };
    }
    const cause = error instanceof Error ? error.cause : null;
    if (cause && typeof cause === 'object' && 'code' in cause && cause.code === '23505') {
      set.status = 409;
      return { error: { code: 'DUPLICATE', message: 'This record already exists.' } };
    }
    set.status = 500;
    return { error: { code: 'INTERNAL_ERROR', message: 'The request failed. Your last saved data is preserved.' } };
  })
  .get('/health', async () => {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok', runtime: 'bun', database: 'postgresql' };
  })
  .get('/state', async ({ request }) => personalData(await profileId(request)))
  .get('/profile', async ({ request }) => {
    const state = await personalData(await profileId(request));
    return { ...state.profile, source: 'manual', manualOverride: true };
  })
  .put('/profile', async ({ request, body }) => {
    const row = await saveProfile(await profileId(request), body);
    return {
      id: row.id, uid: row.uid, name: row.name, server: row.server,
      revision: row.revision, updatedAt: row.updatedAt,
      lastExportGeneratedAt: row.lastExportGeneratedAt, source: 'manual', manualOverride: true
    };
  }, { body: profileInput })
  .get('/characters', async ({ request }) => (await personalData(await profileId(request))).characters)
  .post('/characters', async ({ request, body }) => addCharacter(await profileId(request), body), { body: characterInput })
  .put('/characters/:id', async ({ request, params, body }) => saveCharacter(await profileId(request), params.id, body),
    { params: t.Object({ id: t.String({ format: 'uuid' }) }), body: characterEdit })
  .get('/weapons', async ({ request }) => (await personalData(await profileId(request))).weapons)
  .post('/weapons', async ({ request, body }) => addWeapon(await profileId(request), body), { body: weaponInput })
  .put('/weapons/:id', async ({ request, params, body }) => saveWeapon(await profileId(request), params.id, body),
    { params: t.Object({ id: t.String({ format: 'uuid' }) }), body: weaponEdit })
  .get('/inventory', async ({ request }) => (await personalData(await profileId(request))).inventory)
  .post('/inventory', async ({ request, body }) => addInventory(await profileId(request), body), { body: inventoryInput })
  .put('/inventory/:id', async ({ request, params, body }) => saveInventory(await profileId(request), params.id, body),
    { params: t.Object({ id: t.String({ format: 'uuid' }) }), body: inventoryEdit })
  .get('/goals', async ({ request }) => (await personalData(await profileId(request))).goals)
  .post('/goals', async ({ request, body }) => saveGoal(await profileId(request), body), { body: goalInput })
  .put('/goals/:id', async ({ request, params, body }) => {
    const { revision, ...input } = body;
    return saveGoal(await profileId(request), input, { id: params.id, revision });
  }, { params: t.Object({ id: t.String({ format: 'uuid' }) }), body: goalEdit })
  .get('/conflicts', async ({ request }) => (await personalData(await profileId(request))).conflicts)
  .post('/conflicts/stage', async ({ request, body }) => stageObservation(await profileId(request), body), { body: stageInput })
  .post('/conflicts/:id/resolve', async ({ request, params, body }) => resolveConflict(await profileId(request), params.id, body),
    { params: t.Object({ id: t.String({ format: 'uuid' }) }), body: resolveInput })
  .get('/exports', async ({ request }) => {
    const data = await personalData(await profileId(request), true);
    return Response.json(data, { headers: {
      'content-disposition': `attachment; filename="ilimmu-v1-${data.generatedAt.slice(0, 10)}.json"`,
      'cache-control': 'no-store'
    } });
  });

export const fallback: RequestHandler = ({ request }) =>
  new URL(request.url).pathname.startsWith('/api/auth/')
    ? auth.handler(request)
    : app.handle(request);
