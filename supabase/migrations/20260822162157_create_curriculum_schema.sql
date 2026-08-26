/*
# Create Hacking Curriculum Schema

1. Overview
This migration creates the data model for a hacking learning platform with a hex-tree
skill map. Learners sign up, explore a hexagonal skill tree of course modules, read
lessons, and complete guided labs. Progress is saved per-user.

2. New Tables
- `modules`: Top-level course modules displayed as hexagons in the skill tree.
  - id (uuid PK), slug (unique text), title, description, difficulty (1-5 int),
    category (text), position_x / position_y (int grid coords for hex layout),
    icon (lucide icon name), color (accent color key), sort_order (int), created_at
- `module_prerequisites`: Junction table linking modules to their prerequisite modules.
  - module_id (FK modules), prerequisite_id (FK modules), composite PK
- `lessons`: Ordered lessons within a module.
  - id (uuid PK), module_id (FK modules CASCADE), slug, title, content (text),
    sort_order (int), duration_minutes (int), created_at
- `labs`: Guided hands-on labs within a module.
  - id (uuid PK), module_id (FK modules CASCADE), slug, title, scenario (text),
    objective (text), tasks (jsonb array), hints (jsonb array), solution (text),
    sort_order (int), difficulty (1-5 int), created_at
- `lesson_completions`: Per-user lesson completion records.
  - user_id (FK auth.users CASCADE), lesson_id (FK lessons CASCADE), completed_at,
    composite PK (user_id, lesson_id)
- `lab_completions`: Per-user lab completion records.
  - user_id (FK auth.users CASCADE), lab_id (FK labs CASCADE), completed_at,
    composite PK (user_id, lab_id)

3. Security
- `modules`, `module_prerequisites`, `lessons`, `labs` are curriculum content:
  readable by anon + authenticated (public content), writable by no one via RLS
  (managed via migrations only).
- `lesson_completions`, `lab_completions` are per-user progress: owner-scoped CRUD
  for authenticated users only. user_id defaults to auth.uid() so inserts that omit
  user_id still satisfy the WITH CHECK.

4. Notes
- Module status (locked / unlocked / in_progress / completed) is derived in the
  frontend from prerequisite completion + lab completion data.
- No destructive operations; all tables use IF NOT EXISTS.
*/

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  category text NOT NULL DEFAULT 'general',
  position_x int NOT NULL DEFAULT 0,
  position_y int NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'Terminal',
  color text NOT NULL DEFAULT 'green',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_modules" ON modules;
CREATE POLICY "anon_read_modules" ON modules FOR SELECT
  TO anon, authenticated USING (true);

-- Module prerequisites junction
CREATE TABLE IF NOT EXISTS module_prerequisites (
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  PRIMARY KEY (module_id, prerequisite_id)
);

ALTER TABLE module_prerequisites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_module_prerequisites" ON module_prerequisites;
CREATE POLICY "anon_read_module_prerequisites" ON module_prerequisites FOR SELECT
  TO anon, authenticated USING (true);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  duration_minutes int NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  UNIQUE (module_id, slug)
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_lessons" ON lessons;
CREATE POLICY "anon_read_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  scenario text NOT NULL DEFAULT '',
  objective text NOT NULL DEFAULT '',
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  solution text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (module_id, slug)
);

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_labs" ON labs;
CREATE POLICY "anon_read_labs" ON labs FOR SELECT
  TO anon, authenticated USING (true);

-- Lesson completions (per-user progress)
CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_completions" ON lesson_completions;
CREATE POLICY "select_own_lesson_completions" ON lesson_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lesson_completions" ON lesson_completions;
CREATE POLICY "insert_own_lesson_completions" ON lesson_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lesson_completions" ON lesson_completions;
CREATE POLICY "delete_own_lesson_completions" ON lesson_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Lab completions (per-user progress)
CREATE TABLE IF NOT EXISTS lab_completions (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, lab_id)
);

ALTER TABLE lab_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lab_completions" ON lab_completions;
CREATE POLICY "select_own_lab_completions" ON lab_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lab_completions" ON lab_completions;
CREATE POLICY "insert_own_lab_completions" ON lab_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lab_completions" ON lab_completions;
CREATE POLICY "delete_own_lab_completions" ON lab_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for progress lookups
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_labs_module_id ON labs(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_completions_user ON lab_completions(user_id);
