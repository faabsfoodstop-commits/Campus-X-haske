-- CRITICAL FIX: users table is missing UPDATE and INSERT RLS policies.
-- Without these, all profile saves and point updates silently fail (0 rows affected, no error).
-- This explains: profile data not persisting, points staying 0, profile_complete never set.

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
