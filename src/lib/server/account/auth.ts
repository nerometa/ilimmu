import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { z } from 'zod';
import { db } from '../db';
import * as schema from '../db/schema';
import { developmentOrigins } from './origins';

const baseURL = z.url().parse(process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
  secret: z.string().min(32).parse(process.env.BETTER_AUTH_SECRET),
  baseURL,
  trustedOrigins: [new URL(baseURL).origin, ...developmentOrigins(baseURL, process.env.NODE_ENV)],
  database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    cookieCache: { enabled: false }
  },
  rateLimit: { enabled: true, window: 60, max: 30, storage: 'database' }
});
