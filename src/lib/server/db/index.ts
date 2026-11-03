import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as schema from './schema';

const databaseUrl = z.url().parse(process.env.DATABASE_URL);
export const sqlClient = postgres(databaseUrl, { max: 5, onnotice: () => undefined });
export const db = drizzle(sqlClient, { schema });
