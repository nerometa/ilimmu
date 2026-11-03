import { and, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type { GoalInput, goalEdit } from '../../contracts';
import { db } from '../db';
import { characters, goals, weapons } from '../db/schema';
import { changed, present, WriteError } from '../provenance/safe-write';

export async function saveGoal(profileId: string, input: GoalInput, edit?: {
  readonly id: string;
  readonly revision: z.infer<typeof goalEdit>['revision'];
}) {
  return db.transaction(async (tx) => {
    const { completed, ...data } = input;
    if (data.characterId) {
      const [subject] = await tx.select().from(characters).where(and(
        eq(characters.id, data.characterId), eq(characters.profileId, profileId)
      ));
      if (!subject) throw new WriteError(422, 'INVALID_SUBJECT', 'Choose an owned character.');
    }
    if (data.weaponId) {
      const [subject] = await tx.select().from(weapons).where(and(
        eq(weapons.id, data.weaponId), eq(weapons.profileId, profileId)
      ));
      if (!subject) throw new WriteError(422, 'INVALID_SUBJECT', 'Choose an owned weapon instance.');
    }
    const completedAt = completed ? new Date() : null;
    if (edit) {
      const [row] = await tx.update(goals).set({
        ...data, completedAt, revision: sql`${goals.revision} + 1`, updatedAt: new Date()
      }).where(and(eq(goals.id, edit.id), eq(goals.profileId, profileId),
        eq(goals.revision, edit.revision))).returning();
      return changed(row);
    }
    const [row] = await tx.insert(goals).values({ ...data, profileId, completedAt }).returning();
    return present(row);
  });
}
