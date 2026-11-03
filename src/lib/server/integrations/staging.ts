import { and, eq, isNull, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type { resolveInput, stageInput } from '../../contracts';
import { db } from '../db';
import { conflicts, inventory, observations } from '../db/schema';
import { changed, present, WriteError } from '../provenance/safe-write';

// Phase 1 deliberately stages fixture observations only, never external imports.
export async function stageObservation(profileId: string, input: z.infer<typeof stageInput>) {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(inventory).where(and(
      eq(inventory.id, input.inventoryId), eq(inventory.profileId, profileId)
    )).for('update');
    const current = present(actual);
    if (current.revision !== input.revision) {
      throw new WriteError(409, 'STALE_REVISION', 'Reload the inventory record before staging.');
    }
    const [observation] = await tx.insert(observations).values({
      profileId, inventoryId: current.id, quantity: input.quantity, source: input.source
    }).returning();
    const [conflict] = await tx.insert(conflicts).values({
      profileId, inventoryId: current.id, observationId: present(observation).id
    }).returning();
    return present(conflict);
  });
}

export async function resolveConflict(profileId: string, id: string, input: z.infer<typeof resolveInput>) {
  return db.transaction(async (tx) => {
    const [conflict] = await tx.select().from(conflicts).where(and(
      eq(conflicts.id, id), eq(conflicts.profileId, profileId),
      eq(conflicts.revision, input.revision), isNull(conflicts.resolution)
    )).for('update');
    const current = changed(conflict);
    const [actual] = await tx.select().from(inventory).where(and(
      eq(inventory.id, current.inventoryId), eq(inventory.profileId, profileId),
      eq(inventory.revision, input.inventoryRevision)
    )).for('update');
    changed(actual);
    const [observation] = await tx.select().from(observations)
      .where(eq(observations.id, current.observationId));
    const observed = present(observation);
    switch (input.resolution) {
      case 'accept-source':
        await tx.update(inventory).set({
          quantity: observed.quantity, source: observed.source, manualOverride: false,
          revision: sql`${inventory.revision} + 1`, updatedAt: new Date()
        }).where(eq(inventory.id, current.inventoryId));
        break;
      case 'keep-manual':
        break;
    }
    const [resolved] = await tx.update(conflicts).set({
      resolution: input.resolution, resolvedAt: new Date(),
      revision: sql`${conflicts.revision} + 1`
    }).where(eq(conflicts.id, current.id)).returning();
    return present(resolved);
  });
}
