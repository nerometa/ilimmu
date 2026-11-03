import { sql } from 'drizzle-orm';
import {
  pgTable, text, timestamp, boolean, integer, bigint, uuid, check, uniqueIndex
} from 'drizzle-orm/pg-core';

const utc = (name: string) => timestamp(name, { withTimezone: true });

export const user = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: utc('created_at').notNull().defaultNow(),
  updatedAt: utc('updated_at').notNull().defaultNow(),
  soleOwner: boolean('sole_owner').notNull().default(true)
}, (t) => [
  uniqueIndex('one_owner_only').on(t.soleOwner),
  check('owner_must_be_true', sql`${t.soleOwner} = true`)
]);

export const session = pgTable('auth_session', {
  id: text('id').primaryKey(),
  expiresAt: utc('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: utc('created_at').notNull().defaultNow(),
  updatedAt: utc('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('auth_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: utc('access_token_expires_at'),
  refreshTokenExpiresAt: utc('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: utc('created_at').notNull().defaultNow(),
  updatedAt: utc('updated_at').notNull().defaultNow()
});

export const verification = pgTable('auth_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: utc('expires_at').notNull(),
  createdAt: utc('created_at').notNull().defaultNow(),
  updatedAt: utc('updated_at').notNull().defaultNow()
});

export const rateLimit = pgTable('auth_rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull()
});

export const profile = pgTable('game_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').notNull().unique().references(() => user.id),
  uid: text('uid').notNull().default(''),
  name: text('name').notNull().default('Traveler'),
  server: text('server', { enum: ['America', 'Europe', 'Asia', 'TW/HK/MO'] }).notNull().default('Asia'),
  revision: integer('revision').notNull().default(0),
  updatedAt: utc('updated_at').notNull().defaultNow(),
  lastExportGeneratedAt: utc('last_export_generated_at')
}, (t) => [
  check('profile_revision_nonnegative', sql`${t.revision} >= 0`),
  check('profile_server_valid', sql`${t.server} IN ('America', 'Europe', 'Asia', 'TW/HK/MO')`),
  check('profile_uid_valid', sql`${t.uid} = '' OR ${t.uid} ~ '^[0-9]{9,10}$'`)
]);

const provenance = () => ({
  revision: integer('revision').notNull().default(0),
  manualOverride: boolean('manual_override').notNull().default(true),
  source: text('source').notNull().default('manual'),
  updatedAt: utc('updated_at').notNull().defaultNow()
});

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  gameId: integer('game_id').notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  ascension: integer('ascension').notNull(),
  talentAttack: integer('talent_attack').notNull(),
  talentSkill: integer('talent_skill').notNull(),
  talentBurst: integer('talent_burst').notNull(),
  ...provenance()
}, (t) => [
  uniqueIndex('owned_character_game_id').on(t.profileId, t.gameId),
  check('character_bounds', sql`${t.gameId} > 0 AND ${t.level} BETWEEN 1 AND 90 AND ${t.ascension} BETWEEN 0 AND 6 AND ${t.talentAttack} BETWEEN 1 AND 15 AND ${t.talentSkill} BETWEEN 1 AND 15 AND ${t.talentBurst} BETWEEN 1 AND 15 AND ${t.revision} >= 0`)
]);

export const weapons = pgTable('weapon_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  gameId: integer('game_id').notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  ascension: integer('ascension').notNull(),
  refinement: integer('refinement').notNull(),
  ...provenance()
}, (t) => [
  check('weapon_bounds', sql`${t.gameId} > 0 AND ${t.level} BETWEEN 1 AND 90 AND ${t.ascension} BETWEEN 0 AND 6 AND ${t.refinement} BETWEEN 1 AND 5 AND ${t.revision} >= 0`)
]);

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  gameId: integer('game_id').notNull(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  ...provenance()
}, (t) => [
  uniqueIndex('inventory_game_id').on(t.profileId, t.gameId),
  check('quantity_bounds', sql`${t.gameId} > 0 AND ${t.quantity} >= 0 AND ${t.revision} >= 0`)
]);

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  characterId: uuid('character_id').references(() => characters.id),
  weaponId: uuid('weapon_id').references(() => weapons.id),
  name: text('name').notNull(),
  priority: text('priority', { enum: ['Actively Building', 'Maintain', 'Planned for Later'] }).notNull(),
  targetLevel: integer('target_level').notNull(),
  targetAscension: integer('target_ascension').notNull(),
  targetAttack: integer('target_attack'),
  targetSkill: integer('target_skill'),
  targetBurst: integer('target_burst'),
  buildNotes: text('build_notes').notNull().default(''),
  completedAt: utc('completed_at'),
  revision: integer('revision').notNull().default(0),
  updatedAt: utc('updated_at').notNull().defaultNow()
}, (t) => [
  check('goal_one_subject', sql`(${t.characterId} IS NOT NULL)::integer + (${t.weaponId} IS NOT NULL)::integer = 1`),
  check('goal_bounds', sql`${t.targetLevel} BETWEEN 1 AND 90 AND ${t.targetAscension} BETWEEN 0 AND 6 AND ${t.revision} >= 0 AND (${t.targetAttack} IS NULL OR ${t.targetAttack} BETWEEN 1 AND 15) AND (${t.targetSkill} IS NULL OR ${t.targetSkill} BETWEEN 1 AND 15) AND (${t.targetBurst} IS NULL OR ${t.targetBurst} BETWEEN 1 AND 15)`),
  check('goal_priority_valid', sql`${t.priority} IN ('Actively Building', 'Maintain', 'Planned for Later')`)
]);

export const observations = pgTable('inventory_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id),
  quantity: integer('quantity').notNull(),
  source: text('source').notNull(),
  observedAt: utc('observed_at').notNull().defaultNow()
}, (t) => [check('observation_quantity_valid', sql`${t.quantity} >= 0`)]);

export const conflicts = pgTable('inventory_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profile.id),
  observationId: uuid('observation_id').notNull().unique().references(() => observations.id),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id),
  resolution: text('resolution', { enum: ['keep-manual', 'accept-source'] }),
  resolvedAt: utc('resolved_at'),
  revision: integer('revision').notNull().default(0),
  createdAt: utc('created_at').notNull().defaultNow()
}, (t) => [check('resolution_valid', sql`${t.resolution} IS NULL OR ${t.resolution} IN ('keep-manual', 'accept-source')`)]);
