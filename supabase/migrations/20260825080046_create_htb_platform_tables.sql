/*
# Create Hack-the-Box Platform Tables

1. Overview
This migration adds the core tables for a competitive hacking platform:
user profiles with points, simulated machines, CTF challenges, solve tracking,
and a leaderboard view that aggregates points across all sources.

2. New Tables
- `user_profiles`: Per-user profile with total points, rank title, bio, country.
  - id (uuid PK = auth.users.id), total_points (int), rank_title (text),
    bio (text), country (text), created_at, updated_at
- `machines`: Simulated vulnerable target definitions.
  - id (uuid PK), slug (unique text), title, os, difficulty (1-4: easy/medium/hard/insane),
    points (int), ip (text), environment (jsonb: hosts, files, tools, success conditions),
    user_flag (text), system_flag (text), created_at
- `machine_solves`: Tracks which users solved which machines and at what tier.
  - id (uuid PK), user_id (FK auth.users CASCADE), machine_id (FK machines CASCADE),
    tier (text: 'user' or 'system'), solved_at, UNIQUE(user_id, machine_id, tier)
- `ctf_challenges`: CTF challenge definitions across categories.
  - id (uuid PK), slug (unique text), title, category (text), difficulty (1-5 int),
    points (int), description (text), hint (text), flag_hash (text), created_at
- `ctf_solves`: Tracks which users solved which CTF challenges.
  - id (uuid PK), user_id (FK auth.users CASCADE), challenge_id (FK ctf_challenges CASCADE),
    solved_at, UNIQUE(user_id, challenge_id)

3. Views
- `leaderboard`: Aggregates total points per user from user_profiles,
  ordered by total_points descending.

4. Security
- `user_profiles`: Owner can read/update own profile. All authenticated users
  can read profiles (for leaderboard). Anon cannot read.
- `machines`, `ctf_challenges`: Public read (anon + authenticated), no write via RLS.
- `machine_solves`, `ctf_solves`: Owner-scoped insert + select. All authenticated
  users can select (for solve counts and first-blood). Anon cannot.
- `leaderboard` view: Readable by all authenticated users.

5. Notes
- user_profiles.id references auth.users(id) directly (1:1 relationship).
- total_points on user_profiles is the single source of truth for leaderboard ranking.
- The frontend updates total_points when a machine or CTF is solved.
- machine_solves and ctf_solves have UNIQUE constraints to prevent duplicate solves.
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points int NOT NULL DEFAULT 0,
  rank_title text NOT NULL DEFAULT 'Noob',
  bio text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_all_profiles" ON user_profiles;
CREATE POLICY "select_all_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  os text NOT NULL DEFAULT 'Linux',
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 4),
  points int NOT NULL DEFAULT 20,
  ip text NOT NULL DEFAULT '10.10.10.5',
  environment jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_flag text NOT NULL DEFAULT '',
  system_flag text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_machines" ON machines;
CREATE POLICY "anon_read_machines" ON machines FOR SELECT
  TO anon, authenticated USING (true);

-- Machine solves table
CREATE TABLE IF NOT EXISTS machine_solves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'user' CHECK (tier IN ('user', 'system')),
  solved_at timestamptz DEFAULT now(),
  UNIQUE (user_id, machine_id, tier)
);

ALTER TABLE machine_solves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_machine_solves" ON machine_solves;
CREATE POLICY "select_all_machine_solves" ON machine_solves FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_machine_solve" ON machine_solves;
CREATE POLICY "insert_own_machine_solve" ON machine_solves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_machine_solve" ON machine_solves;
CREATE POLICY "delete_own_machine_solve" ON machine_solves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- CTF challenges table
CREATE TABLE IF NOT EXISTS ctf_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'web',
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  points int NOT NULL DEFAULT 50,
  description text NOT NULL DEFAULT '',
  hint text NOT NULL DEFAULT '',
  flag_hash text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_ctf_challenges" ON ctf_challenges;
CREATE POLICY "anon_read_ctf_challenges" ON ctf_challenges FOR SELECT
  TO anon, authenticated USING (true);

-- CTF solves table
CREATE TABLE IF NOT EXISTS ctf_solves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
  solved_at timestamptz DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

ALTER TABLE ctf_solves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_ctf_solves" ON ctf_solves;
CREATE POLICY "select_all_ctf_solves" ON ctf_solves FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_ctf_solve" ON ctf_solves;
CREATE POLICY "insert_own_ctf_solve" ON ctf_solves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ctf_solve" ON ctf_solves;
CREATE POLICY "delete_own_ctf_solve" ON ctf_solves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  id,
  total_points,
  rank_title,
  bio,
  country,
  created_at,
  ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) AS rank_position
FROM user_profiles
ORDER BY total_points DESC, created_at ASC;

ALTER VIEW leaderboard OWNER TO postgres;
GRANT SELECT ON leaderboard TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_machine_solves_machine ON machine_solves(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_solves_user ON machine_solves(user_id);
CREATE INDEX IF NOT EXISTS idx_ctf_solves_challenge ON ctf_solves(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctf_solves_user ON ctf_solves(user_id);
