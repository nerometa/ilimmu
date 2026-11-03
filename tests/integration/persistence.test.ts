import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { and, eq } from 'drizzle-orm';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = new URL(process.env.DATABASE_URL ?? '');
const testName = `companion_test_${crypto.randomUUID().replaceAll('-', '')}`;
const adminUrl = new URL(base);
adminUrl.pathname = '/postgres';
const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => undefined });
base.pathname = `/${testName}`;
process.env.DATABASE_URL = base.toString();

let services: typeof import('../../src/lib/server/records/service');
let staging: typeof import('../../src/lib/server/integrations/staging');
let planning: typeof import('../../src/lib/server/goals/service');
let exporting: typeof import('../../src/lib/server/exports/service');
let database: typeof import('../../src/lib/server/db');
let tables: typeof import('../../src/lib/server/db/schema');
let profileId: string;
let migrationTmp: string;
let created = false;

beforeAll(async () => {
  await admin.unsafe(`CREATE DATABASE "${testName}"`);
  created = true;
  database = await import('../../src/lib/server/db');
  tables = await import('../../src/lib/server/db/schema');
  services = await import('../../src/lib/server/records/service');
  staging = await import('../../src/lib/server/integrations/staging');
  planning = await import('../../src/lib/server/goals/service');
  exporting = await import('../../src/lib/server/exports/service');

  // Rehearse a real upgrade from the first migration, then apply the remainder.
  migrationTmp = await mkdtemp(join(tmpdir(), 'companion-migration-'));
  await mkdir(join(migrationTmp, 'meta'));
  const journal = JSON.parse(await readFile('migrations/meta/_journal.json', 'utf8'));
  const first = journal.entries[0];
  if (!first) throw new Error('Initial migration is required.');
  await cp(`migrations/${first.tag}.sql`, join(migrationTmp, `${first.tag}.sql`));
  await writeFile(join(migrationTmp, 'meta/_journal.json'), JSON.stringify({
    ...journal, entries: [first]
  }));
  await migrate(database.db, { migrationsFolder: migrationTmp });
  await migrate(database.db, { migrationsFolder: 'migrations' });
  await database.db.insert(tables.user).values({
    id: 'integration-owner', email: 'integration@example.test', name: 'Integration'
  });
  const [row] = await database.db.insert(tables.profile).values({ ownerId: 'integration-owner' }).returning();
  if (!row) throw new Error('Profile fixture failed.');
  profileId = row.id;
}, 30000);

afterAll(async () => {
  if (database) await database.sqlClient.end();
  if (created) await admin.unsafe(`DROP DATABASE IF EXISTS "${testName}" WITH (FORCE)`);
  await admin.end();
  if (migrationTmp) await rm(migrationTmp, { recursive: true });
});

describe('real PostgreSQL persistence and safe updates', () => {
  it('runs all migrations from a fresh database as well as the upgrade fixture', async () => {
    const freshName = `${testName}_fresh`;
    await admin.unsafe(`CREATE DATABASE "${freshName}"`);
    const freshUrl = new URL(base);
    freshUrl.pathname = `/${freshName}`;
    const client = postgres(freshUrl.toString(), { onnotice: () => undefined });
    try {
      await migrate(drizzle(client), { migrationsFolder: 'migrations' });
      const result = await client`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`;
      expect(result[0]?.count).toBeGreaterThanOrEqual(12);
    } finally {
      await client.end();
      await admin.unsafe(`DROP DATABASE "${freshName}"`);
    }
  });

  it('enforces the sole owner constraint in PostgreSQL', async () => {
    await expect(database.db.insert(tables.user).values({
      id: 'second', email: 'second@example.test', name: 'Second'
    })).rejects.toThrow();
  });

  it('persists profile changes and rejects stale revisions', async () => {
    await services.saveProfile(profileId, { uid: '800000001', name: 'Journal', server: 'Asia', revision: 0 });
    await expect(services.saveProfile(profileId, {
      uid: '800000002', name: 'Wrong', server: 'Europe', revision: 0
    })).rejects.toMatchObject({ status: 409 });
    expect((await services.ownerProfile('integration-owner')).name).toBe('Journal');
  });

  it('preserves duplicate weapon definitions as distinct instances', async () => {
    const input = { gameId: 11401, name: 'Favonius Sword', level: 20, ascension: 0, refinement: 1 };
    const first = await services.addWeapon(profileId, input);
    const second = await services.addWeapon(profileId, input);
    expect(first.id).not.toBe(second.id);
  });

  it('allows only one simultaneous revision edit to succeed', async () => {
    const material = await services.addInventory(profileId, { gameId: 202, name: 'Mora', quantity: 100 });
    const results = await Promise.allSettled([200, 300].map((quantity) =>
      services.saveInventory(profileId, material.id, { gameId: 202, name: 'Mora', quantity, revision: 0 })
    ));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const failure = results.find((r) => r.status === 'rejected');
    expect(failure).toMatchObject({ reason: { status: 409 } });
  });

  it('rejects invalid quantities at the database constraint without losing saved data', async () => {
    const material = await services.addInventory(profileId, { gameId: 104003, name: 'Hero Wit', quantity: 12 });
    await expect(database.db.update(tables.inventory).set({ quantity: -1 })
      .where(eq(tables.inventory.id, material.id))).rejects.toThrow();
    const [saved] = await database.db.select().from(tables.inventory).where(eq(tables.inventory.id, material.id));
    expect(saved?.quantity).toBe(12);
  });

  it.each(['keep-manual', 'accept-source'] as const)('resolves %s without changing plans or the observation', async (resolution) => {
    const material = await services.addInventory(profileId, {
      gameId: resolution === 'keep-manual' ? 301 : 302, name: resolution, quantity: 77
    });
    const conflict = await staging.stageObservation(profileId, {
      inventoryId: material.id, quantity: 20, revision: 0, source: 'fixture-observation'
    });
    const staged = await exporting.personalData(profileId);
    expect(staged.inventory.find((r) => r.id === material.id)?.quantity).toBe(77);
    await staging.resolveConflict(profileId, conflict.id, {
      resolution, revision: 0, inventoryRevision: 0
    });
    const output = await exporting.personalData(profileId);
    const actual = output.inventory.find((r) => r.id === material.id);
    expect(actual?.quantity).toBe(resolution === 'keep-manual' ? 77 : 20);
    expect(actual?.manualOverride).toBe(resolution === 'keep-manual');
    expect(output.observations.find((r) => r.id === conflict.observationId)?.quantity).toBe(20);
    expect(output.goals).toEqual(staged.goals);
  });

  it('rolls back a stale conflict resolution atomically', async () => {
    const material = await services.addInventory(profileId, { gameId: 303, name: 'Crystal', quantity: 8 });
    const conflict = await staging.stageObservation(profileId, {
      inventoryId: material.id, quantity: 2, revision: 0, source: 'fixture-observation'
    });
    await services.saveInventory(profileId, material.id, { gameId: 303, name: 'Crystal', quantity: 11, revision: 0 });
    await expect(staging.resolveConflict(profileId, conflict.id, {
      resolution: 'accept-source', revision: 0, inventoryRevision: 0
    })).rejects.toMatchObject({ status: 409 });
    const [saved] = await database.db.select().from(tables.conflicts).where(eq(tables.conflicts.id, conflict.id));
    expect(saved?.resolution).toBeNull();
    const [actual] = await database.db.select().from(tables.inventory).where(eq(tables.inventory.id, material.id));
    expect(actual?.quantity).toBe(11);
  });

  it('rejects mutation of staged observations in PostgreSQL', async () => {
    const material = await services.addInventory(profileId, { gameId: 304, name: 'Observation fixture', quantity: 9 });
    const conflict = await staging.stageObservation(profileId, {
      inventoryId: material.id, quantity: 4, revision: 0, source: 'fixture-observation'
    });
    await expect(database.db.update(tables.observations).set({ quantity: 99 })
      .where(eq(tables.observations.id, conflict.observationId))).rejects.toThrow();
  });

  it('rolls back the actual write when conflict persistence fails after it', async () => {
    const material = await services.addInventory(profileId, { gameId: 305, name: 'Rollback fixture', quantity: 41 });
    const conflict = await staging.stageObservation(profileId, {
      inventoryId: material.id, quantity: 2, revision: 0, source: 'fixture-observation'
    });
    await database.sqlClient.unsafe(`
      CREATE FUNCTION test_reject_resolution() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test injected persistence failure'; END; $$;
      CREATE TRIGGER test_reject_resolution BEFORE UPDATE ON inventory_conflicts
      FOR EACH ROW EXECUTE FUNCTION test_reject_resolution();
    `);
    try {
      await expect(staging.resolveConflict(profileId, conflict.id, {
        resolution: 'accept-source', revision: 0, inventoryRevision: 0
      })).rejects.toThrow();
      const [actual] = await database.db.select().from(tables.inventory).where(eq(tables.inventory.id, material.id));
      const [saved] = await database.db.select().from(tables.conflicts).where(eq(tables.conflicts.id, conflict.id));
      expect(actual?.quantity).toBe(41);
      expect(actual?.manualOverride).toBe(true);
      expect(saved?.resolution).toBeNull();
    } finally {
      await database.sqlClient.unsafe(`
        DROP TRIGGER test_reject_resolution ON inventory_conflicts;
        DROP FUNCTION test_reject_resolution();
      `);
    }
  });

  it('saves multiple targets and explicit completion without changing actual progression', async () => {
    const character = await services.addCharacter(profileId, {
      gameId: 10000021, name: 'Amber', level: 20, ascension: 0,
      talentAttack: 1, talentSkill: 1, talentBurst: 1
    });
    const input = {
      characterId: character.id, weaponId: null, name: 'First target',
      priority: 'Actively Building' as const, targetLevel: 80, targetAscension: 5,
      targetAttack: 8, targetSkill: 8, targetBurst: 8, buildNotes: 'Manual target', completed: true
    };
    await planning.saveGoal(profileId, input);
    await planning.saveGoal(profileId, { ...input, name: 'Second target', completed: false });
    const [actual] = await database.db.select().from(tables.characters).where(eq(tables.characters.id, character.id));
    expect(actual?.level).toBe(20);
    const targets = await database.db.select().from(tables.goals).where(and(
      eq(tables.goals.profileId, profileId), eq(tables.goals.characterId, character.id)
    ));
    expect(targets).toHaveLength(2);
    expect(targets.filter((r) => r.completedAt !== null)).toHaveLength(1);
  });

  it('exports validated personal data without authentication records and records generation', async () => {
    const output = await exporting.personalData(profileId, true);
    expect(output.version).toBe(1);
    expect(output.profile.lastExportGeneratedAt).toBe(output.generatedAt);
    expect(Object.keys(output).sort()).toEqual([
      'characters', 'conflicts', 'format', 'generatedAt', 'goals', 'inventory',
      'observations', 'profile', 'version', 'weapons'
    ]);
    expect(JSON.stringify(output)).not.toMatch(/integration@example\.test|password|token|secret|ownerId/);
    expect((await services.ownerProfile('integration-owner')).lastExportGeneratedAt?.toISOString()).toBe(output.generatedAt);
  });
});
