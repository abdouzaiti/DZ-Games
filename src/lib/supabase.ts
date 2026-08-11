import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.SUPABASE_URL || '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY as string) || (window as any)._env_?.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.info('Supabase credentials not found. Online multiplayer is in setup mode.');
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
