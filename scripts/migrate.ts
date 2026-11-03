import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sqlClient } from '../src/lib/server/db';

try {
  await migrate(db, { migrationsFolder: './migrations' });
  console.info('Migrations applied.');
} finally {
  await sqlClient.end();
}
