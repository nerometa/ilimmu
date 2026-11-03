import { existsSync } from 'node:fs';
import { join } from 'node:path';

// This checkout's retained local database. Fresh checkouts use README setup.
const root = join(import.meta.dir, '..', '.local', 'preview');
const pg = join(root, 'tools/usr/lib/postgresql/16/bin');
if (!existsSync(join(pg, 'pg_ctl')) || !process.env.DATABASE_URL) {
  throw new Error('Preview setup is missing. Follow README Local development first.');
}
const env = {
  ...process.env,
  LD_LIBRARY_PATH: `${root}/tools/usr/lib/x86_64-linux-gnu${process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''}`,
  NODE_ENV: 'development',
  ORIGIN: 'http://localhost:4173',
  BETTER_AUTH_URL: 'http://localhost:4173'
};
async function run(command: string[]) {
  const child = Bun.spawn(command, { env, stdout: 'inherit', stderr: 'inherit' });
  if (await child.exited !== 0) throw new Error(`${command[0]} failed.`);
}
// Refuse a second instance before touching the database.
const port = Bun.listen({ hostname: '127.0.0.1', port: 4173, socket: { data() {} } });
port.stop(true);
const status = Bun.spawn([join(pg, 'pg_ctl'), '-D', join(root, 'data'), 'status'], {
  env, stdout: 'ignore', stderr: 'ignore'
});
if (await status.exited === 0) {
  throw new Error('The preview database is already running. Stop the existing preview before restarting.');
}
let server: ReturnType<typeof Bun.spawn> | undefined;
let interrupted = false;
const stop = () => { interrupted = true; server?.kill('SIGTERM'); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  await run([join(pg, 'pg_ctl'), '-D', join(root, 'data'), '-l', join(root, 'postgres.log'),
    '-o', `-h 127.0.0.1 -p 55439 -k ${root}`, '-w', 'start']);
  await run([process.execPath, 'scripts/migrate.ts']);
  if (!interrupted) {
    console.info('\nPreview: http://localhost:4173 (127.0.0.1:4173 also works). Ctrl+C stops app and database.\n');
    server = Bun.spawn([process.execPath, '--bun', 'node_modules/vite/bin/vite.js',
      '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
      env, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit'
    });
    const code = await server.exited;
    if (!interrupted && code !== 0) process.exitCode = code;
  }
} finally {
  await run([join(pg, 'pg_ctl'), '-D', join(root, 'data'), '-m', 'fast', '-w', 'stop']);
}
