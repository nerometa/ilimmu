import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdtemp, readFile, realpath, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import postgres from 'postgres';
import type { TransactionSql } from 'postgres';
import { z } from 'zod';

class RestoreCheckError extends Error {
  constructor(readonly stage: string) {
    super(`Restore verification failed at ${stage}. Details withheld to protect database values.`);
    this.name = 'RestoreCheckError';
  }
}

const config = z.object({
  DATABASE_URL: z.url(),
  PG_BIN: z.string().min(1)
}).safeParse(process.env);
if (!config.success) {
  console.error('DATABASE_URL and PG_BIN are required; configuration values are not printed.');
  process.exit(1);
}

const settings = config.data;
const sourceUrl = new URL(settings.DATABASE_URL);
if (!['postgres:', 'postgresql:'].includes(sourceUrl.protocol)
  || !sourceUrl.hostname || !sourceUrl.username || !isAbsolute(settings.PG_BIN)
  || [...sourceUrl.searchParams.keys()].some((key) => key !== 'sslmode')) {
  console.error('Use an absolute PG_BIN and a PostgreSQL URL with host, user, database, and optional sslmode only.');
  process.exit(1);
}
const sourceName = decodeURIComponent(sourceUrl.pathname.slice(1));
if (!sourceName || ['postgres', 'template0', 'template1'].includes(sourceName)) {
  console.error('DATABASE_URL must identify the application database, not a maintenance database.');
  process.exit(1);
}

const restoreName = `companion_restore_${randomUUID().replaceAll('-', '')}`;
const schemaName = `companion_schema_${randomUUID().replaceAll('-', '')}`;
const restoreUrl = new URL(sourceUrl);
restoreUrl.pathname = `/${restoreName}`;
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = '/postgres';
const connection = {
  application_name: 'companion-restore-verification',
  statement_timeout: 120000,
  lock_timeout: 10000,
  TimeZone: 'UTC',
  DateStyle: 'ISO, YMD',
  IntervalStyle: 'postgres'
};
const source = postgres(sourceUrl.toString(), {
  max: 1, connect_timeout: 10, onnotice: () => undefined,
  connection: { ...connection, default_transaction_read_only: true }
});
const admin = postgres(adminUrl.toString(), {
  max: 1, connect_timeout: 10, onnotice: () => undefined, connection
});
const restored = postgres(restoreUrl.toString(), {
  max: 1, connect_timeout: 10, onnotice: () => undefined,
  connection: { ...connection, default_transaction_read_only: true }
});

// Only this process's generated database and mkdtemp directory are mutable.
let ownedDirectory: string | undefined;
const ownedDatabases: string[] = [];
let passed = false;
const receipts: { stage: string; exitCode: number }[] = [];
const cleanup: { resource: string; removed: boolean }[] = [];

function pgEnvironment(databaseName: string): Record<string, string | undefined> {
  return {
    ...process.env,
    PGHOST: sourceUrl.hostname,
    PGPORT: sourceUrl.port || '5432',
    PGUSER: decodeURIComponent(sourceUrl.username),
    PGPASSWORD: decodeURIComponent(sourceUrl.password),
    PGDATABASE: databaseName,
    PGSSLMODE: sourceUrl.searchParams.get('sslmode') ?? 'prefer',
    PGCONNECT_TIMEOUT: '10',
    PGAPPNAME: 'companion-restore-verification',
    PGOPTIONS: '-c statement_timeout=120000 -c lock_timeout=10000'
  };
}

async function pgCommand(tool: 'pg_dump' | 'pg_restore', args: readonly string[],
  databaseName: string, stage: string): Promise<string> {
  const child = Bun.spawn([join(settings.PG_BIN, tool), ...args], {
    env: pgEnvironment(databaseName), stdin: 'ignore',
    stdout: 'pipe', stderr: 'pipe', timeout: 180000
  });
  const [output, , exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).arrayBuffer(),
    child.exited
  ]);
  receipts.push({ stage, exitCode });
  if (exitCode !== 0) throw new RestoreCheckError(stage);
  return output;
}

type TableDigest = {
  readonly schema: string;
  readonly table: string;
  readonly rows: number;
  readonly digest: string;
};

async function tableDigests(sql: TransactionSql): Promise<readonly TableDigest[]> {
  const tables = z.array(z.object({ schema: z.string(), table: z.string() })).parse(
    await sql`
      SELECT n.nspname AS schema, c.relname AS table
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p')
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
      ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C"
    `
  );
  const result: TableDigest[] = [];
  for (const table of tables) {
    const hash = createHash('sha256');
    let rows = 0;
    // Stream canonical rows; never log their contents, including auth tables.
    for await (const batch of sql`
      SELECT row_to_json(t)::jsonb::text AS value
      FROM ${sql(table.schema)}.${sql(table.table)} t
      ORDER BY row_to_json(t)::jsonb::text COLLATE "C"
    `.cursor(100)) {
      for (const row of z.array(z.object({ value: z.string() })).parse(batch)) {
        hash.update(row.value).update('\n');
        rows++;
      }
    }
    result.push({ schema: table.schema, table: table.table, rows, digest: hash.digest('hex') });
  }
  return result;
}

function normalizedSchema(text: string): string {
  // New pg_dump maintenance releases randomize these psql safety tokens.
  return text.split('\n').filter((line) =>
    !/^\\(?:un)?restrict [A-Za-z0-9]+$/.test(line)).join('\n');
}

try {
  const dumpVersion = await pgCommand('pg_dump', ['--version'], sourceName, 'pg-dump-version');
  const restoreVersion = await pgCommand('pg_restore', ['--version'], sourceName, 'pg-restore-version');
  const server = z.object({ version: z.number() }).parse(
    (await source`SELECT current_setting('server_version_num')::int AS version`)[0]
  );
  if (!dumpVersion.startsWith('pg_dump (PostgreSQL) 16.')
    || !restoreVersion.startsWith('pg_restore (PostgreSQL) 16.')
    || Math.floor(server.version / 10000) !== 16) {
    throw new RestoreCheckError('PostgreSQL-16-version-match');
  }
  ownedDirectory = await realpath(await mkdtemp(join(tmpdir(), 'companion-restore-')));
  await chmod(ownedDirectory, 0o700);
  const dumpFile = join(ownedDirectory, 'backup.dump');
  const sourceSchemaFile = join(ownedDirectory, 'source-schema.sql');
  const restoredSchemaFile = join(ownedDirectory, 'restored-schema.sql');

  const proof = await source.begin('isolation level repeatable read read only', async (tx) => {
    const snapshot = z.object({ id: z.string() }).parse(
      (await tx`SELECT pg_export_snapshot() AS id`)[0]
    );
    const expected = await tableDigests(tx);
    // An empty or unmigrated database cannot establish application recovery.
    for (const required of ['auth_user', 'auth_account', 'auth_session', 'game_profile', 'inventory', 'goals']) {
      if (!expected.some((table) => table.schema === 'public' && table.table === required)) {
        throw new RestoreCheckError('required-application-and-auth-schema');
      }
    }
    if (!expected.some((table) => table.table === 'auth_account' && table.rows > 0)) {
      throw new RestoreCheckError('nonempty-synthetic-auth-fixture-required');
    }
    await pgCommand('pg_dump', [
      '--format=custom', `--snapshot=${snapshot.id}`, '--file', dumpFile
    ], sourceName, 'custom-dump');
    await chmod(dumpFile, 0o600);
    await admin`CREATE DATABASE ${admin(restoreName)} TEMPLATE template0`;
    ownedDatabases.push(restoreName);
    await pgCommand('pg_restore', [
      '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl',
      '--dbname', restoreName, dumpFile
    ], restoreName, 'isolated-restore');
    await pgCommand('pg_dump', [
      '--schema-only', '--no-owner', '--no-acl', '--file', restoredSchemaFile
    ], restoreName, 'restored-schema-dump');
    // PostgreSQL may canonicalize associative CHECK expressions on restore.
    // Independently round-trip only the source schema, without restoring data;
    // compare engine-canonical DDL rather than stripping meaningful parentheses.
    await admin`CREATE DATABASE ${admin(schemaName)} TEMPLATE template0`;
    ownedDatabases.push(schemaName);
    await pgCommand('pg_restore', [
      '--schema-only', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl',
      '--dbname', schemaName, dumpFile
    ], schemaName, 'reference-schema-only-restore');
    await pgCommand('pg_dump', [
      '--schema-only', '--no-owner', '--no-acl', '--file', sourceSchemaFile
    ], schemaName, 'canonical-source-schema-dump');
    const sourceSchema = normalizedSchema(await readFile(sourceSchemaFile, 'utf8'));
    const restoredSchema = normalizedSchema(await readFile(restoredSchemaFile, 'utf8'));
    const schemaMatches = sourceSchema === restoredSchema;
    if (!schemaMatches) throw new RestoreCheckError('schema-comparison');
    const actual = await restored.begin('isolation level repeatable read read only',
      (restoredTx) => tableDigests(restoredTx));
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      throw new RestoreCheckError('all-table-data-comparison');
    }
    return {
      schemaMatches, schemaComparison: 'independent-schema-only-round-trip',
      allTableDataMatches: true,
      tables: expected.map(({ schema, table, rows }) => ({ schema, table, rows })),
      dumpBytes: (await stat(dumpFile)).size
    };
  });
  passed = true;
  console.info(JSON.stringify({ status: 'PASS', ...proof, authValuesPrinted: false }));
} catch (error) {
  console.error(error instanceof RestoreCheckError
    ? error.message
    : 'Restore verification failed. Database/tool details withheld to protect secrets.');
  process.exitCode = 1;
} finally {
  for (const client of [restored, source]) {
    try {
      await client.end({ timeout: 5 });
    } catch {
      cleanup.push({ resource: 'database-client', removed: false });
      process.exitCode = 1;
    }
  }
  for (const databaseName of ownedDatabases) {
    try {
      await admin`DROP DATABASE ${admin(databaseName)} WITH (FORCE)`;
      const remaining = await admin`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`;
      cleanup.push({ resource: databaseName, removed: remaining.length === 0 });
      if (remaining.length) process.exitCode = 1;
    } catch {
      cleanup.push({ resource: databaseName, removed: false });
      process.exitCode = 1;
    }
  }
  try {
    await admin.end({ timeout: 5 });
  } catch {
    cleanup.push({ resource: 'admin-client', removed: false });
    process.exitCode = 1;
  }
  if (ownedDirectory) {
    try {
      await rm(ownedDirectory, { recursive: true });
      const removed = !existsSync(ownedDirectory);
      cleanup.push({ resource: ownedDirectory, removed });
      if (!removed) process.exitCode = 1;
    } catch {
      cleanup.push({ resource: ownedDirectory, removed: false });
      process.exitCode = 1;
    }
  }
  console.info(JSON.stringify({
    status: passed && !process.exitCode ? 'COMPLETE' : 'FAILED',
    commands: receipts, cleanup, sourceDatabaseWritten: false
  }));
}
