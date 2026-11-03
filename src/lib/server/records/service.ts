import { and, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type {
  ProfileInput, CharacterInput, WeaponInput, InventoryInput,
  characterEdit, weaponEdit, inventoryEdit
} from '../../contracts';
import { db } from '../db';
import { characters, inventory, profile, weapons } from '../db/schema';
import { changed, present } from '../provenance/safe-write';

export async function ownerProfile(ownerId: string) {
  const [row] = await db.select().from(profile).where(eq(profile.ownerId, ownerId));
  return present(row);
}

export async function saveProfile(profileId: string, input: ProfileInput) {
  const { revision, ...data } = input;
  const [row] = await db.update(profile).set({
    ...data, revision: sql`${profile.revision} + 1`, updatedAt: new Date()
  }).where(and(eq(profile.id, profileId), eq(profile.revision, revision))).returning();
  return changed(row);
}

export async function addCharacter(profileId: string, input: CharacterInput) {
  const [row] = await db.insert(characters).values({ ...input, profileId }).returning();
  return present(row);
}

export async function saveCharacter(profileId: string, id: string, input: z.infer<typeof characterEdit>) {
  const { revision, ...data } = input;
  const [row] = await db.update(characters).set({
    ...data, source: 'manual', manualOverride: true,
    revision: sql`${characters.revision} + 1`, updatedAt: new Date()
  }).where(and(eq(characters.id, id), eq(characters.profileId, profileId),
    eq(characters.revision, revision))).returning();
  return changed(row);
}

export async function addWeapon(profileId: string, input: WeaponInput) {
  const [row] = await db.insert(weapons).values({ ...input, profileId }).returning();
  return present(row);
}

export async function saveWeapon(profileId: string, id: string, input: z.infer<typeof weaponEdit>) {
  const { revision, ...data } = input;
  const [row] = await db.update(weapons).set({
    ...data, source: 'manual', manualOverride: true,
    revision: sql`${weapons.revision} + 1`, updatedAt: new Date()
  }).where(and(eq(weapons.id, id), eq(weapons.profileId, profileId),
    eq(weapons.revision, revision))).returning();
  return changed(row);
}

export async function addInventory(profileId: string, input: InventoryInput) {
  const [row] = await db.insert(inventory).values({ ...input, profileId }).returning();
  return present(row);
}

export async function saveInventory(profileId: string, id: string, input: z.infer<typeof inventoryEdit>) {
  const { revision, ...data } = input;
  const [row] = await db.update(inventory).set({
    ...data, source: 'manual', manualOverride: true,
    revision: sql`${inventory.revision} + 1`, updatedAt: new Date()
  }).where(and(eq(inventory.id, id), eq(inventory.profileId, profileId),
    eq(inventory.revision, revision))).returning();
  return changed(row);
}
