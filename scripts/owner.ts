import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, sqlClient } from '../src/lib/server/db';
import { account, profile, session, user } from '../src/lib/server/db/schema';

const input = z.object({
  OWNER_EMAIL: z.email(),
  OWNER_PASSWORD: z.string().min(12).max(128)
}).parse(process.env);
const mode = z.enum(['provision', 'reset']).parse(process.argv[2]);

try {
  const password = await hashPassword(input.OWNER_PASSWORD);
  await db.transaction(async (tx) => {
    // Serializes simultaneous operator provisioning without public registration.
    await tx.execute('SELECT pg_advisory_xact_lock(7281041)');
    const [owner] = await tx.select().from(user).limit(1);
    switch (mode) {
      case 'provision': {
        if (owner) throw new Error('Owner already provisioned. Use reset.');
        const id = crypto.randomUUID();
        await tx.insert(user).values({
          id, name: 'Owner', email: input.OWNER_EMAIL, emailVerified: true
        });
        await tx.insert(account).values({
          id: crypto.randomUUID(), accountId: id, providerId: 'credential',
          userId: id, password
        });
        await tx.insert(profile).values({ ownerId: id });
        break;
      }
      case 'reset': {
        if (!owner || owner.email !== input.OWNER_EMAIL) {
          throw new Error('The provisioned owner email must match.');
        }
        await tx.update(account).set({ password, updatedAt: new Date() })
          .where(eq(account.userId, owner.id));
        await tx.delete(session).where(eq(session.userId, owner.id));
        break;
      }
    }
  });
  console.info(`Owner ${mode} completed. No credentials are printed.`);
} finally {
  await sqlClient.end();
}
