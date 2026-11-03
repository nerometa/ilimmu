import { z } from 'zod';

const name = z.string().trim().min(1).max(100);
const gameId = z.number().int().positive().max(2147483647);
const level = z.number().int().min(1).max(90);
const ascension = z.number().int().min(0).max(6);
const talent = z.number().int().min(1).max(15);
export const revision = z.number().int().nonnegative().max(2147483646);
export const quantity = z.number().int().nonnegative().max(2147483647);
export const profileInput = z.strictObject({
  uid: z.string().regex(/^(?:[0-9]{9,10})?$/),
  name,
  server: z.enum(['America', 'Europe', 'Asia', 'TW/HK/MO']),
  revision
});
export const characterInput = z.strictObject({
  gameId, name, level, ascension,
  talentAttack: talent, talentSkill: talent, talentBurst: talent
});
export const weaponInput = z.strictObject({
  gameId, name, level, ascension, refinement: z.number().int().min(1).max(5)
});
export const inventoryInput = z.strictObject({ gameId, name, quantity });
export const characterEdit = characterInput.extend({ revision });
export const weaponEdit = weaponInput.extend({ revision });
export const inventoryEdit = inventoryInput.extend({ revision });
export const priorities = ['Actively Building', 'Maintain', 'Planned for Later'] as const;
const goalFields = z.strictObject({
  characterId: z.uuid().nullable().default(null),
  weaponId: z.uuid().nullable().default(null),
  name,
  priority: z.enum(priorities),
  targetLevel: level,
  targetAscension: ascension,
  targetAttack: talent.nullable().default(null),
  targetSkill: talent.nullable().default(null),
  targetBurst: talent.nullable().default(null),
  buildNotes: z.string().max(2000).default(''),
  completed: z.boolean().default(false)
});
const oneSubject = (v: { readonly characterId: string | null; readonly weaponId: string | null }) =>
  Number(v.characterId !== null) + Number(v.weaponId !== null) === 1;
export const goalInput = goalFields.refine(oneSubject, {
  message: 'Choose exactly one character or weapon instance.'
});
export const goalEdit = goalFields.extend({ revision }).refine(oneSubject);
export const stageInput = z.strictObject({
  inventoryId: z.uuid(), quantity, revision,
  source: z.literal('fixture-observation')
});
export const resolveInput = z.strictObject({
  resolution: z.enum(['keep-manual', 'accept-source']),
  revision, inventoryRevision: revision
});

const recordMeta = {
  id: z.uuid(), profileId: z.uuid(), revision,
  manualOverride: z.boolean(), source: z.string(), updatedAt: z.iso.datetime()
};
export const characterRecord = characterInput.extend(recordMeta);
export const weaponRecord = weaponInput.extend(recordMeta);
export const inventoryRecord = inventoryInput.extend(recordMeta);
export const goalRecord = goalFields.omit({ completed: true }).extend({
  id: z.uuid(), profileId: z.uuid(), revision,
  completedAt: z.iso.datetime().nullable(), updatedAt: z.iso.datetime()
}).refine(oneSubject);
export const exportSchema = z.strictObject({
  format: z.literal('genshin-companion'),
  version: z.literal(1),
  generatedAt: z.iso.datetime(),
  profile: profileInput.extend({
    id: z.uuid(), updatedAt: z.iso.datetime(),
    lastExportGeneratedAt: z.iso.datetime().nullable()
  }),
  characters: z.array(characterRecord),
  weapons: z.array(weaponRecord),
  inventory: z.array(inventoryRecord),
  goals: z.array(goalRecord),
  observations: z.array(z.strictObject({
    id: z.uuid(), profileId: z.uuid(), inventoryId: z.uuid(), quantity,
    source: z.string(), observedAt: z.iso.datetime()
  })),
  conflicts: z.array(z.strictObject({
    id: z.uuid(), profileId: z.uuid(), observationId: z.uuid(), inventoryId: z.uuid(),
    resolution: z.enum(['keep-manual', 'accept-source']).nullable(),
    revision, resolvedAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime()
  }))
});

export type ProfileInput = z.infer<typeof profileInput>;
export type CharacterInput = z.infer<typeof characterInput>;
export type WeaponInput = z.infer<typeof weaponInput>;
export type InventoryInput = z.infer<typeof inventoryInput>;
export type GoalInput = z.infer<typeof goalInput>;
export type ExportData = z.infer<typeof exportSchema>;
