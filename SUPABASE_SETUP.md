# Supabase Database Setup

To enable online multiplayer, accounts, and custom profile pictures, please run the following SQL in your **Supabase SQL Editor**:

```sql
-- 1. Create Users table to store accounts and profile pictures/avatars
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar TEXT NOT NULL DEFAULT '👤', -- This stores either an emoji or a long Base64 image string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Matches table to store game sessions
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Players table to store participants in each match
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL, -- Stores player avatar (emoji or Base64 image)
  slot_index INT NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime for live synchronization
-- Ensure you go to the "Realtime" section in Supabase dashboard and enable it for 'matches' and 'players' tables if this SQL doesn't do it automatically.
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- 5. Enable Row Level Security (RLS) and create policies
-- For initial setup, we allow all operations. In production, restrict based on user IDs.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true);
```

## How Base64 Profile Pictures work in PostgreSQL
The `avatar` column is set to type `TEXT`. In PostgreSQL, a `TEXT` column can store strings up to **1 GB** in size. This is perfect for storing our custom compressed Base64 images directly, avoiding the need for an external Storage bucket and making profile image syncing instantaneous!

## Environment Variables
After setting up the database, add these to your Secrets in AI Studio:
- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_KEY`: Your Supabase Anon Key

