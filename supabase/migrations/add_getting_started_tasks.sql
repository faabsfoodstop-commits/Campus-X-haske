-- Add getting_started_tasks table
CREATE TABLE IF NOT EXISTS getting_started_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  reward_points INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  points_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

ALTER TABLE getting_started_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can read own getting started tasks" ON getting_started_tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can insert own getting started tasks" ON getting_started_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own getting started tasks" ON getting_started_tasks;
CREATE POLICY "Users can update own getting started tasks" ON getting_started_tasks
  FOR UPDATE USING (auth.uid() = user_id);
