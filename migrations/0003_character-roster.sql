ALTER TABLE characters ADD COLUMN owned boolean NOT NULL DEFAULT true;
CREATE TABLE character_builds (
  profile_id uuid NOT NULL REFERENCES game_profile(id),
  game_id integer NOT NULL,
  data jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_build_per_character ON character_builds(profile_id, game_id);
