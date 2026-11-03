CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"ascension" integer NOT NULL,
	"talent_attack" integer NOT NULL,
	"talent_skill" integer NOT NULL,
	"talent_burst" integer NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"manual_override" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_bounds" CHECK ("characters"."game_id" > 0 AND "characters"."level" BETWEEN 1 AND 90 AND "characters"."ascension" BETWEEN 0 AND 6 AND "characters"."talent_attack" BETWEEN 1 AND 15 AND "characters"."talent_skill" BETWEEN 1 AND 15 AND "characters"."talent_burst" BETWEEN 1 AND 15 AND "characters"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"observation_id" uuid NOT NULL,
	"inventory_id" uuid NOT NULL,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_conflicts_observation_id_unique" UNIQUE("observation_id"),
	CONSTRAINT "resolution_valid" CHECK ("inventory_conflicts"."resolution" IS NULL OR "inventory_conflicts"."resolution" IN ('keep-manual', 'accept-source'))
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"character_id" uuid,
	"weapon_id" uuid,
	"name" text NOT NULL,
	"priority" text NOT NULL,
	"target_level" integer NOT NULL,
	"target_ascension" integer NOT NULL,
	"target_attack" integer,
	"target_skill" integer,
	"target_burst" integer,
	"build_notes" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goal_one_subject" CHECK (("goals"."character_id" IS NOT NULL)::integer + ("goals"."weapon_id" IS NOT NULL)::integer = 1),
	CONSTRAINT "goal_bounds" CHECK ("goals"."target_level" BETWEEN 1 AND 90 AND "goals"."target_ascension" BETWEEN 0 AND 6 AND "goals"."revision" >= 0 AND ("goals"."target_attack" IS NULL OR "goals"."target_attack" BETWEEN 1 AND 15) AND ("goals"."target_skill" IS NULL OR "goals"."target_skill" BETWEEN 1 AND 15) AND ("goals"."target_burst" IS NULL OR "goals"."target_burst" BETWEEN 1 AND 15)),
	CONSTRAINT "goal_priority_valid" CHECK ("goals"."priority" IN ('Actively Building', 'Maintain', 'Planned for Later'))
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"manual_override" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quantity_bounds" CHECK ("inventory"."game_id" > 0 AND "inventory"."quantity" >= 0 AND "inventory"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"inventory_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"source" text NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "observation_quantity_valid" CHECK ("inventory_observations"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "game_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"uid" text DEFAULT '' NOT NULL,
	"name" text DEFAULT 'Traveler' NOT NULL,
	"server" text DEFAULT 'Asia' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_export_generated_at" timestamp with time zone,
	CONSTRAINT "game_profile_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "profile_revision_nonnegative" CHECK ("game_profile"."revision" >= 0),
	CONSTRAINT "profile_server_valid" CHECK ("game_profile"."server" IN ('America', 'Europe', 'Asia', 'TW/HK/MO')),
	CONSTRAINT "profile_uid_valid" CHECK ("game_profile"."uid" = '' OR "game_profile"."uid" ~ '^[0-9]{9,10}$')
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sole_owner" boolean DEFAULT true NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email"),
	CONSTRAINT "owner_must_be_true" CHECK ("auth_user"."sole_owner" = true)
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weapon_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"ascension" integer NOT NULL,
	"refinement" integer NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"manual_override" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weapon_bounds" CHECK ("weapon_instances"."game_id" > 0 AND "weapon_instances"."level" BETWEEN 1 AND 90 AND "weapon_instances"."ascension" BETWEEN 0 AND 6 AND "weapon_instances"."refinement" BETWEEN 1 AND 5 AND "weapon_instances"."revision" >= 0)
);
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_conflicts" ADD CONSTRAINT "inventory_conflicts_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_conflicts" ADD CONSTRAINT "inventory_conflicts_observation_id_inventory_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."inventory_observations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_conflicts" ADD CONSTRAINT "inventory_conflicts_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_weapon_id_weapon_instances_id_fk" FOREIGN KEY ("weapon_id") REFERENCES "public"."weapon_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_observations" ADD CONSTRAINT "inventory_observations_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_observations" ADD CONSTRAINT "inventory_observations_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_profile" ADD CONSTRAINT "game_profile_owner_id_auth_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weapon_instances" ADD CONSTRAINT "weapon_instances_profile_id_game_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."game_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "owned_character_game_id" ON "characters" USING btree ("profile_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_game_id" ON "inventory" USING btree ("profile_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_owner_only" ON "auth_user" USING btree ("sole_owner");