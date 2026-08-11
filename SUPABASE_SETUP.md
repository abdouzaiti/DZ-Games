# Supabase Database Setup

To enable online multiplayer, please run the following SQL in your Supabase SQL Editor:

```sql
-- 1. Create Matches table to store game sessions
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Players table to store participants in each match
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  slot_index INT NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime for live synchronization
-- Ensure you go to the "Realtime" section in Supabase dashboard and enable it for 'matches' and 'players' tables if this SQL doesn't do it automatically.
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- 4. Enable Row Level Security (RLS) and create policies
-- For initial setup, we allow all operations. In production, restrict based on user IDs.
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true);
```

## Environment Variables
After setting up the database, add these to your Secrets in AI Studio:
- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_KEY`: Your Supabase Anon Key
