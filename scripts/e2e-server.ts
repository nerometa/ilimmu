import postgres from 'postgres';
import { z } from 'zod';

const config = z.object({
  DATABASE_URL: z.url(), OWNER_EMAIL: z.email(),
  OWNER_PASSWORD: z.string().min(12),
  QA_DATABASE_NAME: z.string().regex(/^companion_e2e_[a-f0-9]+$/)
}).parse(process.env);
const adminUrl = new URL(config.DATABASE_URL);
adminUrl.pathname = '/postgres';
const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => undefined });
const name = config.QA_DATABASE_NAME;
const isolatedUrl = new URL(config.DATABASE_URL);
isolatedUrl.pathname = `/${name}`;
const childEnv = { ...process.env, DATABASE_URL: isolatedUrl.toString() };
let server: ReturnType<typeof Bun.spawn> | undefined;
let created = false;
let stopping = false;
const stop = () => {
  stopping = true;
  server?.kill('SIGTERM');
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);

async function command(args: string[]) {
  const child = Bun.spawn(args, { env: childEnv, stdout: 'inherit', stderr: 'inherit' });
  const exit = await child.exited;
  if (exit !== 0) throw new Error(`QA setup command ${args[1]} failed with exit ${exit}.`);
}

try {
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  created = true;
  await command(['bun', 'scripts/migrate.ts']);
  await command(['bun', 'scripts/owner.ts', 'provision']);
  if (!stopping) {
    server = Bun.spawn(['bun', './build'], { env: childEnv, stdout: 'inherit', stderr: 'inherit' });
    const exit = await server.exited;
    if (!stopping && exit !== 0) throw new Error(`QA server exited ${exit}.`);
  }
} finally {
  server?.kill('SIGTERM');
  if (server) await server.exited;
  if (created) await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.end();
  console.info('QA cleanup: isolated database dropped and server exited.');
}
