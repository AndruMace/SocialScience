-- Apply if you see: column "activity_xp" of relation "game_state" does not exist
-- Prefer: from repo root, `bun run db:push` with DATABASE_URL set (syncs schema from Drizzle).
-- Or run this file: psql "$DATABASE_URL" -f packages/server/src/db/migrations/manual/add_game_state_activity_columns.sql

ALTER TABLE game_state ADD COLUMN IF NOT EXISTS activity_xp integer NOT NULL DEFAULT 0;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS follower_stature_xp integer NOT NULL DEFAULT 0;

-- Existing rows only had `xp`; treat prior total as activity until analytics sync adds follower stature.
UPDATE game_state SET activity_xp = xp WHERE activity_xp = 0;
