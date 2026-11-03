import { eq } from 'drizzle-orm';
import { exportSchema } from '../../contracts';
import { db } from '../db';
import {
  characters, conflicts, goals, inventory, observations, profile, weapons
} from '../db/schema';
import { present } from '../provenance/safe-write';

export async function personalData(profileId: string, generateExport = false) {
  return db.transaction(async (tx) => {
    const [accountProfile] = await tx.select().from(profile).where(eq(profile.id, profileId));
    const row = present(accountProfile);
    const generatedAt = new Date();
    const data = {
      format: 'genshin-companion', version: 1, generatedAt,
      profile: {
        id: row.id, uid: row.uid, name: row.name, server: row.server,
        revision: row.revision, updatedAt: row.updatedAt,
        lastExportGeneratedAt: generateExport ? generatedAt : row.lastExportGeneratedAt
      },
      characters: await tx.select().from(characters).where(eq(characters.profileId, profileId)),
      weapons: await tx.select().from(weapons).where(eq(weapons.profileId, profileId)),
      inventory: await tx.select().from(inventory).where(eq(inventory.profileId, profileId)),
      goals: await tx.select().from(goals).where(eq(goals.profileId, profileId)),
      observations: await tx.select().from(observations).where(eq(observations.profileId, profileId)),
      conflicts: await tx.select().from(conflicts).where(eq(conflicts.profileId, profileId))
    };
    // A strict allowlist is parsed before the generated timestamp is committed.
    const output = exportSchema.parse(JSON.parse(JSON.stringify(data)));
    if (generateExport) {
      await tx.update(profile).set({ lastExportGeneratedAt: generatedAt })
        .where(eq(profile.id, profileId));
    }
    return output;
  }, { isolationLevel: 'repeatable read' });
}
