/*
# Terminal State Persistence

1. Overview
This migration adds tables to persist each learner's terminal state per lab:
their virtual filesystem, installed tools, and command history. This lets learners
resume labs with their files and tools intact between sessions.

2. New Tables
- `user_terminal_state`: One row per user per lab storing the virtual filesystem
  (JSON), installed tools (text[]), and working directory path.
  - id (uuid PK), user_id (FK auth.users CASCADE), lab_id (FK labs CASCADE),
    filesystem (jsonb), installed_tools (text[]), cwd (text), created_at, updated_at
  - Unique constraint on (user_id, lab_id) so each user has one state per lab.
- `user_command_log`: Append-only log of commands run by each user in each lab,
  used for lab validation (checking success conditions).
  - id (uuid PK), user_id (FK auth.users CASCADE), lab_id (FK labs CASCADE),
    command (text), created_at

3. Security
- Both tables are owner-scoped: each authenticated user can only CRUD their own rows.
- user_id defaults to auth.uid() so inserts that omit user_id still satisfy WITH CHECK.
- No anon access — terminal state requires authentication.

4. Notes
- The filesystem JSON stores a tree of directories and files with content.
- installed_tools is a simple array of tool slug names.
- The command log is append-only (no UPDATE/DELETE policies needed, but we add
  DELETE for cleanup if the lab is removed via CASCADE).
*/

-- User terminal state (virtual filesystem + installed tools per lab)
CREATE TABLE IF NOT EXISTS user_terminal_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  filesystem jsonb NOT NULL DEFAULT '{}'::jsonb,
  installed_tools text[] NOT NULL DEFAULT '{}',
  cwd text NOT NULL DEFAULT '/',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lab_id)
);

ALTER TABLE user_terminal_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_terminal_state" ON user_terminal_state;
CREATE POLICY "select_own_terminal_state" ON user_terminal_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_terminal_state" ON user_terminal_state;
CREATE POLICY "insert_own_terminal_state" ON user_terminal_state
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_terminal_state" ON user_terminal_state;
CREATE POLICY "update_own_terminal_state" ON user_terminal_state
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_terminal_state" ON user_terminal_state;
CREATE POLICY "delete_own_terminal_state" ON user_terminal_state
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User command log (append-only per lab)
CREATE TABLE IF NOT EXISTS user_command_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  command text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_command_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_command_log" ON user_command_log;
CREATE POLICY "select_own_command_log" ON user_command_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_command_log" ON user_command_log;
CREATE POLICY "insert_own_command_log" ON user_command_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_command_log" ON user_command_log;
CREATE POLICY "delete_own_command_log" ON user_command_log
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_terminal_state_user_lab ON user_terminal_state(user_id, lab_id);
CREATE INDEX IF NOT EXISTS idx_command_log_user_lab ON user_command_log(user_id, lab_id);