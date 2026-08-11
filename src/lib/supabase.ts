import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (process.env.SUPABASE_URL as string) || '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY as string) || (process.env.SUPABASE_KEY as string) || '';

if (!supabaseUrl || !supabaseKey) {
  console.info('Supabase credentials not found. Online multiplayer is in setup mode.');
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
